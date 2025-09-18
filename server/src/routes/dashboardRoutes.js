import express from 'express';
import { verifyToken, authorize } from '../middlewares/authmiddleware.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Apply authentication and authorization for all dashboard routes
router.use(verifyToken, authorize('teacher'));

// --- Dashboard Routes ---
router.get('/stats', dashboardController.getDashboardStats);
router.get('/activity', dashboardController.getRecentActivity);

// --- To-Do List Routes ---
router.get('/todos', dashboardController.getTodos);
router.post('/todos', dashboardController.addTodo);
router.patch('/todos/:todoId', dashboardController.toggleTodo);
router.delete('/todos/:todoId', dashboardController.deleteTodo);

export default router;