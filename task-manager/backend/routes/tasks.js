module.exports = function(io) {
    const router = require('express').Router();
    const Task = require('../models/Task');
    const auth = require('../middleware/auth');

    router.get('/', auth, async (req, res) => {
        try {
            const tasks = await Task.find({ userId: req.user.id });
            res.json(tasks);
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    router.post('/', auth, async (req, res) => {
        try {
            const { title, description, status, dueDate } = req.body;
            const newTask = new Task({ userId: req.user.id, title, description, status, dueDate });
            const savedTask = await newTask.save();
            io.emit('taskUpdated', { action: 'create', task: savedTask });
            res.status(201).json(savedTask);
        } catch (err) {
            res.status(400).json({ error: 'Failed to create task' });
        }
    });

    router.put('/:id', auth, async (req, res) => {
        try {
            const updatedTask = await Task.findOneAndUpdate(
                { _id: req.params.id, userId: req.user.id },
                req.body,
                { new: true }
            );
            io.emit('taskUpdated', { action: 'update', task: updatedTask });
            res.json(updatedTask);
        } catch (err) {
            res.status(400).json({ error: 'Failed to update task' });
        }
    });

    router.delete('/:id', auth, async (req, res) => {
        try {
            await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
            io.emit('taskUpdated', { action: 'delete', id: req.params.id });
            res.json({ message: 'Task deleted' });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    return router;
};