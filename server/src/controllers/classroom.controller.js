import Classroom, { generateUniqueJoinCode } from '../models/classroom.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { deleteFile, deleteFiles } from '../services/cloudinary.service.js';
import { cloudinary } from '../db.js';
import axios from 'axios';

// Create a new classroom
const createClassroom = asyncHandler(async (req, res) => {
	const teacherId = req.userDoc?._id || req.user?.id;
	const { name, description } = req.body;

	const classroom = await Classroom.create({
		name,
		description,
		teacher: teacherId,
	});

	return ApiResponse.success(res, classroom, 'Classroom created successfully', 201);
});

// Get all classrooms for logged-in user (teacher or student)
const getMyClassrooms = asyncHandler(async (req, res) => {
	const userId = req.user?.id || req.user?._id;
	const role = req.user?.role;

	if (role === 'teacher') {
		const classrooms = await Classroom.find({ teacher: userId })
			.select(
				'name description joinCode students pendingStudents materials createdAt updatedAt',
			)
			.sort({ createdAt: -1 })
			.lean();

		const result = classrooms.map(c => ({
			...c,
			studentCount: c.students?.length || 0,
			pendingCount: c.pendingStudents?.length || 0,
			materialCount: c.materials?.length || 0,
			materials: undefined,
			students: undefined,
			pendingStudents: undefined,
		}));

		return ApiResponse.success(res, result, 'Classrooms fetched');
	}

	if (role === 'student') {
		// Enrolled classrooms
		const enrolled = await Classroom.find({ students: userId })
			.populate('teacher', 'fullname email')
			.select('name description teacher students materials createdAt updatedAt')
			.sort({ createdAt: -1 })
			.lean();

		const enrolledResult = enrolled.map(c => ({
			...c,
			studentCount: c.students?.length || 0,
			materialCount: c.materials?.length || 0,
			status: 'enrolled',
			materials: undefined,
			students: undefined,
		}));

		// Pending classrooms
		const pending = await Classroom.find({ pendingStudents: userId })
			.populate('teacher', 'fullname email')
			.select('name description teacher createdAt')
			.sort({ createdAt: -1 })
			.lean();

		const pendingResult = pending.map(c => ({
			...c,
			studentCount: 0,
			materialCount: 0,
			status: 'pending',
		}));

		return ApiResponse.success(
			res,
			[...enrolledResult, ...pendingResult],
			'Classrooms fetched',
		);
	}

	throw ApiError.Forbidden('Invalid role for classroom access');
});

// Get classroom by ID (full detail)
const getClassroomById = asyncHandler(async (req, res) => {
	const userId = String(req.user?.id || req.user?._id);

	const classroom = await Classroom.findById(req.params.id)
		.populate('teacher', 'fullname email')
		.populate('students', 'fullname email username')
		.populate('pendingStudents', 'fullname email username');

	if (!classroom) {
		throw ApiError.NotFound('Classroom not found');
	}

	const isTeacher = String(classroom.teacher._id) === userId;
	const isEnrolledStudent = classroom.students.some(s => String(s._id) === userId);
	const isPendingStudent = classroom.pendingStudents.some(s => String(s._id) === userId);

	if (!isTeacher && !isEnrolledStudent && !isPendingStudent) {
		throw ApiError.Forbidden('You do not have access to this classroom');
	}

	// Pending students can only see basic info, not materials or student lists
	if (isPendingStudent && !isTeacher && !isEnrolledStudent) {
		const limited = {
			_id: classroom._id,
			name: classroom.name,
			description: classroom.description,
			teacher: classroom.teacher,
			status: 'pending',
		};
		return ApiResponse.success(res, limited, 'Classroom fetched (pending approval)');
	}

	return ApiResponse.success(res, classroom, 'Classroom fetched');
});

// Preview classroom info by join code (for invite link landing page)
const getClassroomPreview = asyncHandler(async (req, res) => {
	const { joinCode } = req.params;

	const classroom = await Classroom.findOne({
		joinCode: String(joinCode).toUpperCase().trim(),
	})
		.populate('teacher', 'fullname')
		.select('name description teacher students pendingStudents')
		.lean();

	if (!classroom) {
		throw ApiError.NotFound('Classroom not found');
	}

	const userId = String(req.user?.id || req.user?._id);
	const isEnrolled = classroom.students?.some(s => String(s) === userId);
	const isPending = classroom.pendingStudents?.some(s => String(s) === userId);

	return ApiResponse.success(
		res,
		{
			_id: classroom._id,
			name: classroom.name,
			description: classroom.description,
			teacherName: classroom.teacher?.fullname || 'Unknown',
			studentCount: classroom.students?.length || 0,
			membershipStatus: isEnrolled ? 'enrolled' : isPending ? 'pending' : 'none',
		},
		'Classroom preview fetched',
	);
});

// Request to join a classroom via join code (goes to pending queue)
const joinClassroom = asyncHandler(async (req, res) => {
	const studentId = req.userDoc?._id || req.user?.id;
	const { joinCode } = req.body;

	const classroom = await Classroom.findOne({
		joinCode: String(joinCode).toUpperCase().trim(),
	});

	if (!classroom) {
		throw ApiError.NotFound('Invalid join code. Classroom not found.');
	}

	const alreadyEnrolled = classroom.students.some(sid => sid.equals(studentId));
	if (alreadyEnrolled) {
		throw ApiError.Conflict('You are already a member of this classroom');
	}

	const alreadyPending = classroom.pendingStudents.some(sid => sid.equals(studentId));
	if (alreadyPending) {
		throw ApiError.Conflict('Your join request is already pending approval');
	}

	classroom.pendingStudents.push(studentId);
	await classroom.save();

	req.io?.to(String(classroom.teacher)).emit('classroom-join-request', {
		classroomId: classroom._id,
		studentId: studentId,
	});

	return ApiResponse.success(
		res,
		{ classroomId: classroom._id, status: 'pending' },
		'Join request sent. Waiting for teacher approval.',
	);
});

// Approve a pending student
const approveStudent = asyncHandler(async (req, res) => {
	const teacherId = String(req.userDoc?._id || req.user?.id);
	const { id, studentId } = req.params;

	const classroom = await Classroom.findById(id);

	if (!classroom) {
		throw ApiError.NotFound('Classroom not found');
	}

	if (String(classroom.teacher) !== teacherId) {
		throw ApiError.Forbidden('Only the classroom teacher can approve students');
	}

	const pendingIndex = classroom.pendingStudents.findIndex(sid => String(sid) === studentId);

	if (pendingIndex === -1) {
		throw ApiError.NotFound('Student is not in the pending list');
	}

	// Move from pending to enrolled
	classroom.pendingStudents.splice(pendingIndex, 1);
	classroom.students.push(studentId);
	await classroom.save();

	req.io?.to(String(studentId)).emit('classroom-request-updated', {
		classroomId: classroom._id,
		status: 'approved',
	});

	return ApiResponse.success(res, null, 'Student approved successfully');
});

// Reject a pending student
const rejectStudent = asyncHandler(async (req, res) => {
	const teacherId = String(req.userDoc?._id || req.user?.id);
	const { id, studentId } = req.params;

	const classroom = await Classroom.findById(id);

	if (!classroom) {
		throw ApiError.NotFound('Classroom not found');
	}

	if (String(classroom.teacher) !== teacherId) {
		throw ApiError.Forbidden('Only the classroom teacher can reject students');
	}

	const pendingIndex = classroom.pendingStudents.findIndex(sid => String(sid) === studentId);

	if (pendingIndex === -1) {
		throw ApiError.NotFound('Student is not in the pending list');
	}

	classroom.pendingStudents.splice(pendingIndex, 1);
	await classroom.save();

	req.io?.to(String(studentId)).emit('classroom-request-updated', {
		classroomId: classroom._id,
		status: 'rejected',
	});

	return ApiResponse.success(res, null, 'Student request rejected');
});

// Upload study material to classroom
const uploadMaterial = asyncHandler(async (req, res) => {
	const teacherId = String(req.userDoc?._id || req.user?.id);

	const classroom = await Classroom.findById(req.params.id);

	if (!classroom) {
		throw ApiError.NotFound('Classroom not found');
	}

	if (String(classroom.teacher) !== teacherId) {
		throw ApiError.Forbidden('Only the classroom teacher can add materials');
	}

	if (!req.file) {
		throw ApiError.BadRequest('No file provided');
	}

	const { title } = req.body;

	const newMaterial = {
		title: title || req.file.originalname?.split('.')[0] || 'Untitled',
		fileUrl: req.file.path,
		originalName: req.file.originalname,
		size: req.file.size || 0,
		publicId: req.file.filename,
	};

	classroom.materials.push(newMaterial);
	await classroom.save();

	// Get the newly added material (which now has an _id)
	const savedMaterial = classroom.materials[classroom.materials.length - 1];

	// Asynchronously trigger the embedding pipeline in the Python service
	// Generate a signed URL so the Python service can download even with strict delivery
	const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';

	let embedUrl = savedMaterial.fileUrl;
	try {
		// If using Cloudinary, generate a signed delivery URL for the raw file
		if (savedMaterial.fileUrl.includes('cloudinary') && req.file.filename) {
			embedUrl = cloudinary.url(req.file.filename, {
				resource_type: 'raw',
				type: 'upload',
				sign_url: true,
				secure: true,
			});
		}
	} catch (signErr) {
		console.warn('[Embed] Could not generate signed URL, using public URL:', signErr.message);
	}

	axios
		.post(`${AGENT_SERVICE_URL}/embed`, {
			classroom_id: classroom._id.toString(),
			doc_id: savedMaterial._id.toString(),
			file_url: embedUrl,
			original_name: savedMaterial.originalName,
		})
		.then(response => {
			console.log(`[Embed] Triggered successfully for ${savedMaterial.originalName}`);
			// Update status to processing
			Classroom.updateOne(
				{ 'materials._id': savedMaterial._id },
				{ $set: { 'materials.$.embeddingStatus': 'processing' } },
			).exec();
		})
		.catch(err => {
			console.error(
				`[Embed Error] Failed to trigger embed for ${savedMaterial.originalName}:`,
				err.message,
			);
			Classroom.updateOne(
				{ 'materials._id': savedMaterial._id },
				{ $set: { 'materials.$.embeddingStatus': 'failed' } },
			).exec();
		});

	req.io?.to(`classroom-${classroom._id}`).emit('classroom-materials-updated', {
		classroomId: classroom._id,
		material: newMaterial,
	});

	return ApiResponse.success(res, classroom, 'Material uploaded successfully');
});

// Delete study material from classroom
const deleteMaterial = asyncHandler(async (req, res) => {
	const teacherId = String(req.userDoc?._id || req.user?.id);
	const { id, materialId } = req.params;

	const classroom = await Classroom.findById(id);

	if (!classroom) {
		throw ApiError.NotFound('Classroom not found');
	}

	if (String(classroom.teacher) !== teacherId) {
		throw ApiError.Forbidden('Only the classroom teacher can delete materials');
	}

	const material = classroom.materials.id(materialId);
	if (!material) {
		throw ApiError.NotFound('Material not found');
	}

	if (material.publicId) {
		try {
			await deleteFile(material.publicId);
		} catch (cloudErr) {
			console.error('[CLASSROOM] Failed to delete from Cloudinary:', cloudErr.message);
		}
	}

	classroom.materials.pull(materialId);
	await classroom.save();

	req.io?.to(`classroom-${classroom._id}`).emit('classroom-materials-updated', {
		classroomId: classroom._id,
		deletedMaterialId: materialId,
	});

	return ApiResponse.success(res, null, 'Material deleted successfully');
});

// Delete classroom
const deleteClassroom = asyncHandler(async (req, res) => {
	const teacherId = String(req.userDoc?._id || req.user?.id);
	const { id } = req.params;

	const classroom = await Classroom.findById(id);

	if (!classroom) {
		throw ApiError.NotFound('Classroom not found');
	}

	if (String(classroom.teacher) !== teacherId) {
		throw ApiError.Forbidden('Only the classroom teacher can delete the classroom');
	}

	// Delete all associated materials from Cloudinary (batch)
	const publicIds = classroom.materials.map(m => m.publicId).filter(Boolean);

	if (publicIds.length > 0) {
		try {
			await deleteFiles(publicIds);
		} catch (cloudErr) {
			console.error('[CLASSROOM] Batch Cloudinary delete error:', cloudErr.message);
		}
	}

	await Classroom.findByIdAndDelete(id);

	return ApiResponse.success(res, null, 'Classroom deleted successfully');
});

// Regenerate classroom join code
const resetJoinCode = asyncHandler(async (req, res) => {
	const teacherId = String(req.userDoc?._id || req.user?.id);
	const { id } = req.params;

	const classroom = await Classroom.findById(id);

	if (!classroom) {
		throw ApiError.NotFound('Classroom not found');
	}

	if (String(classroom.teacher) !== teacherId) {
		throw ApiError.Forbidden('Only the classroom teacher can reset the join code');
	}

	classroom.joinCode = generateUniqueJoinCode();
	await classroom.save();

	return ApiResponse.success(
		res,
		{ joinCode: classroom.joinCode },
		'Classroom join code regenerated successfully',
	);
});

// Student leaves a classroom
const leaveClassroom = asyncHandler(async (req, res) => {
	const studentId = String(req.userDoc?._id || req.user?.id);
	const { id } = req.params;

	const classroom = await Classroom.findById(id);

	if (!classroom) {
		throw ApiError.NotFound('Classroom not found');
	}

	// Check if student is enrolled
	const isEnrolled = classroom.students.some(sid => String(sid) === studentId);
	const isPending = classroom.pendingStudents.some(sid => String(sid) === studentId);

	if (!isEnrolled && !isPending) {
		throw ApiError.BadRequest('You are not a member of this classroom');
	}

	// Remove from enrolled and pending
	classroom.students = classroom.students.filter(sid => String(sid) !== studentId);
	classroom.pendingStudents = classroom.pendingStudents.filter(sid => String(sid) !== studentId);

	await classroom.save();

	return ApiResponse.success(res, null, 'Successfully left the classroom');
});

// Re-embed a material (re-triggers the embedding pipeline with a signed URL)
const reEmbedMaterial = asyncHandler(async (req, res) => {
	const teacherId = String(req.userDoc?._id || req.user?.id);
	const { id, materialId } = req.params;

	const classroom = await Classroom.findById(id);
	if (!classroom) throw ApiError.NotFound('Classroom not found');
	if (String(classroom.teacher) !== teacherId) throw ApiError.Forbidden('Only the teacher can re-embed');

	const material = classroom.materials.id(materialId);
	if (!material) throw ApiError.NotFound('Material not found');

	const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';

	let embedUrl = material.fileUrl;
	try {
		if (material.fileUrl.includes('cloudinary') && material.publicId) {
			embedUrl = cloudinary.url(material.publicId, {
				resource_type: 'raw',
				type: 'upload',
				sign_url: true,
				secure: true,
			});
		}
	} catch (signErr) {
		console.warn('[ReEmbed] Could not generate signed URL:', signErr.message);
	}

	await axios.post(`${AGENT_SERVICE_URL}/embed`, {
		classroom_id: classroom._id.toString(),
		doc_id: material._id.toString(),
		file_url: embedUrl,
		original_name: material.originalName,
	});

	return ApiResponse.success(res, null, 'Re-embed triggered successfully');
});

const getMaterialDownloadUrl = asyncHandler(async (req, res) => {
	const { id, materialId } = req.params;
	const classroom = await Classroom.findById(id);
	if (!classroom) throw ApiError.NotFound('Classroom not found');

	// Verify access (teacher or student)
	const userId = String(req.userDoc?._id || req.user?.id);
	const isTeacher = String(classroom.teacher) === userId;
	const isStudent = classroom.students.some(s => String(s) === userId);
	
	if (!isTeacher && !isStudent) {
		throw ApiError.Forbidden('Access denied');
	}

	const material = classroom.materials.id(materialId);
	if (!material) throw ApiError.NotFound('Material not found');
	if (!material.publicId) throw ApiError.BadRequest('Material is missing publicId, cannot download directly');

	// Create signed URL for downloading
	const signedUrl = cloudinary.url(material.publicId, {
		secure: true,
		sign_url: true,
		flags: 'attachment',
	});

	return ApiResponse.success(res, { downloadUrl: signedUrl }, 'Download URL generated');
});

export {
	createClassroom,
	getMyClassrooms,
	getClassroomById,
	getClassroomPreview,
	joinClassroom,
	approveStudent,
	rejectStudent,
	uploadMaterial,
	deleteMaterial,
	deleteClassroom,
	resetJoinCode,
	leaveClassroom,
	reEmbedMaterial,
	getMaterialDownloadUrl,
};
