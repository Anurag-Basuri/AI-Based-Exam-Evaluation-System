import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["teacher", "agent"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const agentSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    config: {
      title: String,
      totalQuestions: Number,
      mcqCount: Number,
      difficulty: String,
      marksPerMcq: Number,
      marksPerSubjective: Number,
      topicFocus: String,
      additionalInstructions: String,
      selectedMaterials: [String],
    },
    messages: [messageSchema],
    status: {
      type: String,
      enum: ["active", "completed", "error"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  },
  { timestamps: true }
);

// TTL index to automatically clean up old sessions
agentSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AgentSession = mongoose.model("AgentSession", agentSessionSchema);
