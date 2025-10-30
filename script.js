
       let tasks = [];
        let currentFilter = 'all';
        let editingTaskId = null;

        // Initialize
        loadTasks();
        loadTheme();

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('taskmaster-theme', isDark ? 'dark' : 'light');
        });

        function loadTheme() {
            const theme = localStorage.getItem('taskmaster-theme');
            if (theme === 'dark') {
                document.body.classList.add('dark-mode');
                document.getElementById('themeToggle').textContent = '☀️';
            }
        }

        // Load tasks
        function loadTasks() {
            const saved = localStorage.getItem('taskmaster-tasks');
            if (saved) {
                tasks = JSON.parse(saved);
                renderTasks();
                updateStats();
            }
        }

        // Save tasks
        function saveTasks() {
            localStorage.setItem('taskmaster-tasks', JSON.stringify(tasks));
        }

        // Generate ID
        function generateId() {
            return Date.now() + Math.random().toString(36).substr(2, 9);
        }

        // Add task
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const taskText = document.getElementById('taskInput').value.trim();
            const priority = document.getElementById('taskPriority').value;
            const category = document.getElementById('taskCategory').value;
            const dueDate = document.getElementById('taskDueDate').value;
            
            if (!taskText) return;
            
            const task = {
                id: generateId(),
                text: taskText,
                completed: false,
                priority: priority,
                category: category,
                dueDate: dueDate,
                createdAt: new Date().toISOString()
            };
            
            tasks.unshift(task);
            saveTasks();
            renderTasks();
            updateStats();
            
            document.getElementById('taskInput').value = '';
            document.getElementById('taskDueDate').value = '';
        });

        // Render tasks
        function renderTasks() {
            const tasksList = document.getElementById('tasksList');
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            
            let filteredTasks = tasks.filter(task => {
                if (searchTerm && !task.text.toLowerCase().includes(searchTerm)) {
                    return false;
                }
                
                if (currentFilter === 'active' && task.completed) return false;
                if (currentFilter === 'completed' && !task.completed) return false;
                if (currentFilter === 'high' && task.priority !== 'high') return false;
                if (currentFilter === 'medium' && task.priority !== 'medium') return false;
                if (currentFilter === 'low' && task.priority !== 'low') return false;
                
                return true;
            });
            
            if (filteredTasks.length === 0) {
                tasksList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <h3>No tasks found!</h3>
                        <p>${searchTerm ? 'Try a different search' : 'Add a task to get started'}</p>
                    </div>
                `;
                return;
            }
            
            tasksList.innerHTML = filteredTasks.map(task => `
                <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')"></div>
                    <div class="task-content">
                        <div class="task-text">${task.text}</div>
                        <div class="task-meta">
                            <span class="task-badge priority-${task.priority}">${task.priority.toUpperCase()}</span>
                            <span class="task-badge category-badge">${task.category}</span>
                            ${task.dueDate ? `<span class="due-date">📅 ${formatDate(task.dueDate)}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-btn edit-btn" onclick="openEditModal('${task.id}')">✏️</button>
                        <button class="task-btn delete-btn" onclick="deleteTask('${task.id}')">🗑️</button>
                    </div>
                </div>
            `).join('');
        }

        // Toggle task completion
        function toggleTask(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                saveTasks();
                renderTasks();
                updateStats();
            }
        }

        // Delete task
        function deleteTask(id) {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                renderTasks();
                updateStats();
            }
        }

        // Open edit modal
        function openEditModal(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            
            editingTaskId = id;
            document.getElementById('editTaskInput').value = task.text;
            document.getElementById('editTaskPriority').value = task.priority;
            document.getElementById('editTaskCategory').value = task.category;
            document.getElementById('editTaskDueDate').value = task.dueDate || '';
            
            document.getElementById('editModal').classList.add('open');
        }

        // Close modal
        function closeModal() {
            document.getElementById('editModal').classList.remove('open');
            editingTaskId = null;
        }

        document.getElementById('closeModalBtn').addEventListener('click', closeModal);
        document.getElementById('cancelEditBtn').addEventListener('click', closeModal);

        // Edit task
        document.getElementById('editTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const task = tasks.find(t => t.id === editingTaskId);
            if (!task) return;
            
            task.text = document.getElementById('editTaskInput').value.trim();
            task.priority = document.getElementById('editTaskPriority').value;
            task.category = document.getElementById('editTaskCategory').value;
            task.dueDate = document.getElementById('editTaskDueDate').value;
            
            saveTasks();
            renderTasks();
            updateStats();
            closeModal();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', renderTasks);

        // Clear completed
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            const completedCount = tasks.filter(t => t.completed).length;
            if (completedCount === 0) {
                alert('No completed tasks to clear!');
                return;
            }
            
            if (confirm(`Delete ${completedCount} completed task(s)?`)) {
                tasks = tasks.filter(t => !t.completed);
                saveTasks();
                renderTasks();
                updateStats();
            }
        });

        // Update stats
        function updateStats() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const pending = total - completed;
            const high = tasks.filter(t => t.priority === 'high' && !t.completed).length;
            
            document.getElementById('totalTasks').textContent = total;
            document.getElementById('completedTasks').textContent = completed;
            document.getElementById('pendingTasks').textContent = pending;
            document.getElementById('highPriority').textContent = high;
            
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            document.getElementById('progressPercentage').textContent = percentage + '%';
            document.getElementById('progressFill').style.width = percentage + '%';
        }

        // Format date
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            const today = new Date();
            const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
            
            if (diff < 0) return 'Overdue';
            if (diff === 0) return 'Today';
            if (diff === 1) return 'Tomorrow';
            
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        // Close modal on outside click
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                closeModal();
            }
        });
    