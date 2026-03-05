import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Please provide a title for the task'],
        trim: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low', 'none'],
        default: 'none'
    },
    category: {
        type: String,
        default: 'Uncategorized'
    },
    aiAdvice: {
        type: String,
        default: ''
    },
    dueDate: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
