import mongoose from "mongoose";
import slugify from "slugify";

const examSchema = new mongoose.Schema({
    searchId: {
        type: String,
        unique: true,
        required: [true, 'Search ID is required'],
        trim: true,
    },
    title: {
        type: String,
        required: [true, 'Exam title is required'],
        trim: true,
        maxlength: [100, 'Exam title cannot exceed 100 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [400, 'Description cannot exceed 400 characters'],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
    },
    slug: {
        type: String,
        unique: true,
        trim: true,
    },
}, {
    timestamps: true,
});