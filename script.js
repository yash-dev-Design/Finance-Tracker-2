   // Global variables
        let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        let currentView = 'monthly';
        let barChart, pieChart;

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function () {
            initializeDates();
            initializeCharts();
            updateSummary();
            updateCharts();
            renderTransactions();
            updateCategoryFilters();

            // Add event listeners
            document.getElementById('expenseForm').addEventListener('submit', handleExpenseSubmit);
            document.getElementById('incomeForm').addEventListener('submit', handleIncomeSubmit);
        });

        // Initialize date inputs with current date
        function initializeDates() {
            const today = new Date().toISOString().split('T')[0];
            const currentMonth = new Date().toISOString().slice(0, 7);

            document.getElementById('expenseDate').value = today;
            document.getElementById('incomeDate').value = today;
            document.getElementById('monthSelector').value = currentMonth;

            // Initialize year selector
            const currentYear = new Date().getFullYear();
            const yearSelector = document.getElementById('yearSelector');
            yearSelector.innerHTML = '';
            for (let year = currentYear; year >= currentYear - 5; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === currentYear) option.selected = true;
                yearSelector.appendChild(option);
            }
        }

        // Tab switching
        function switchTab(tab) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
            document.getElementById(`${tab}-tab`).classList.add('active');
        }

        // Toggle custom input for "Other" category
        function toggleCustomInput(type) {
            const category = document.getElementById(`${type}Category`).value;
            const customDiv = document.getElementById(`${type}Custom`);

            if (category === 'Other') {
                customDiv.style.display = 'block';
            } else {
                customDiv.style.display = 'none';
            }
        }

        // Handle expense form submission
        function handleExpenseSubmit(e) {
            e.preventDefault();

            const description = document.getElementById('expenseDescription').value;
            const amount = parseFloat(document.getElementById('expenseAmount').value);
            const category = document.getElementById('expenseCategory').value;
            const date = document.getElementById('expenseDate').value;
            const customDescription = document.getElementById('expenseCustomDescription').value;

            const transaction = {
                id: Date.now(),
                description: category === 'Other' && customDescription ? customDescription : description,
                amount: amount,
                category: category,
                date: date,
                type: 'expense',
                customDescription: category === 'Other' ? customDescription : null
            };

            addTransaction(transaction);
            document.getElementById('expenseForm').reset();
            document.getElementById('expenseCustom').style.display = 'none';
            document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        }

        // Handle income form submission
        function handleIncomeSubmit(e) {
            e.preventDefault();

            const description = document.getElementById('incomeDescription').value;
            const amount = parseFloat(document.getElementById('incomeAmount').value);
            const category = document.getElementById('incomeCategory').value;
            const date = document.getElementById('incomeDate').value;
            const customDescription = document.getElementById('incomeCustomDescription').value;

            const transaction = {
                id: Date.now(),
                description: category === 'Other' && customDescription ? customDescription : description,
                amount: amount,
                category: category,
                date: date,
                type: 'income',
                customDescription: category === 'Other' ? customDescription : null
            };

            addTransaction(transaction);
            document.getElementById('incomeForm').reset();
            document.getElementById('incomeCustom').style.display = 'none';
            document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
        }

        // Add transaction
        function addTransaction(transaction) {
            transactions.push(transaction);
            saveTransactions();
            updateSummary();
            updateCharts();
            renderTransactions();
            updateCategoryFilters();
        }

        // Save transactions to localStorage
        function saveTransactions() {
            localStorage.setItem('transactions', JSON.stringify(transactions));
        }

        // Update summary cards
        function updateSummary() {
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const totalExpenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const balance = totalIncome - totalExpenses;

            document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
            document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
            document.getElementById('balance').textContent = `$${balance.toFixed(2)}`;
            document.getElementById('balance').className = `card-value ${balance >= 0 ? 'positive' : 'negative'}`;
        }

        // Switch between monthly and yearly view
        function switchView(view) {
            currentView = view;

            document.getElementById('monthlyBtn').classList.toggle('btn-primary', view === 'monthly');
            document.getElementById('yearlyBtn').classList.toggle('btn-primary', view === 'yearly');

            document.getElementById('monthSelector').style.display = view === 'monthly' ? 'block' : 'none';
            document.getElementById('yearSelector').style.display = view === 'yearly' ? 'block' : 'none';
            document.getElementById('yearlyReport').style.display = view === 'yearly' ? 'block' : 'none';

            updateCharts();
            if (view === 'yearly') {
                updateYearlyReport();
            }
        }

        // Initialize charts
        function initializeCharts() {
            const barCtx = document.getElementById('barChart').getContext('2d');
            const pieCtx = document.getElementById('pieChart').getContext('2d');

            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Income',
                        data: [],
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Expenses',
                        data: [],
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            pieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Update charts based on current view
        function updateCharts() {
            if (currentView === 'monthly') {
                updateMonthlyCharts();
            } else {
                updateYearlyCharts();
            }
        }

        // Update monthly charts
        function updateMonthlyCharts() {
            const selectedMonth = document.getElementById('monthSelector').value;
            const monthTransactions = transactions.filter(t => t.date.slice(0, 7) === selectedMonth);

            // Update bar chart
            const incomeByCategory = {};
            const expensesByCategory = {};

            monthTransactions.forEach(t => {
                if (t.type === 'income') {
                    incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
                } else {
                    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
                }
            });

            const allCategories = [...new Set([...Object.keys(incomeByCategory), ...Object.keys(expensesByCategory)])];

            barChart.data.labels = allCategories;
            barChart.data.datasets[0].data = allCategories.map(cat => incomeByCategory[cat] || 0);
            barChart.data.datasets[1].data = allCategories.map(cat => expensesByCategory[cat] || 0);
            barChart.update();

            // Update pie chart (expenses only)
            const expenseCategories = Object.keys(expensesByCategory);
            const expenseAmounts = Object.values(expensesByCategory);

            pieChart.data.labels = expenseCategories;
            pieChart.data.datasets[0].data = expenseAmounts;
            pieChart.update();
        }

        // Update yearly charts
        function updateYearlyCharts() {
            const selectedYear = document.getElementById('yearSelector').value;
            const yearTransactions = transactions.filter(t => t.date.slice(0, 4) === selectedYear);

            // Group by month
            const monthlyData = {};
            for (let month = 1; month <= 12; month++) {
                const monthStr = month.toString().padStart(2, '0');
                monthlyData[monthStr] = { income: 0, expenses: 0 };
            }

            yearTransactions.forEach(t => {
                const month = t.date.slice(5, 7);
                if (t.type === 'income') {
                    monthlyData[month].income += t.amount;
                } else {
                    monthlyData[month].expenses += t.amount;
                }
            });

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const incomeData = Object.values(monthlyData).map(m => m.income);
            const expenseData = Object.values(monthlyData).map(m => m.expenses);

            barChart.data.labels = months;
            barChart.data.datasets[0].data = incomeData;
            barChart.data.datasets[1].data = expenseData;
            barChart.update();

            // Update pie chart for yearly expenses
            const yearlyExpensesByCategory = {};
            yearTransactions.filter(t => t.type === 'expense').forEach(t => {
                yearlyExpensesByCategory[t.category] = (yearlyExpensesByCategory[t.category] || 0) + t.amount;
            });

            pieChart.data.labels = Object.keys(yearlyExpensesByCategory);
            pieChart.data.datasets[0].data = Object.values(yearlyExpensesByCategory);
            pieChart.update();
        }

        // Update yearly report
        function updateYearlyReport() {
            const selectedYear = document.getElementById('yearSelector').value;
            const yearTransactions = transactions.filter(t => t.date.slice(0, 4) === selectedYear);

            const totalIncome = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const balance = totalIncome - totalExpenses;
            const transactionCount = yearTransactions.length;

            // Update yearly stats
            const yearlyStats = document.getElementById('yearlyStats');
            yearlyStats.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">$${totalIncome.toFixed(2)}</div>
            <div class="stat-label">Total Income</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">$${totalExpenses.toFixed(2)}</div>
            <div class="stat-label">Total Expenses</div>
        </div>
        <div class="stat-item">
            <div class="stat-value ${balance >= 0 ? 'positive' : 'negative'}">$${balance.toFixed(2)}</div>
            <div class="stat-label">Net Balance</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${transactionCount}</div>
            <div class="stat-label">Total Transactions</div>
        </div>
    `;

            // Update monthly breakdown
            const monthlyBreakdown = document.getElementById('monthlyBreakdown');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            let breakdownHTML = '<h4>Monthly Breakdown</h4>';

            for (let month = 1; month <= 12; month++) {
                const monthStr = month.toString().padStart(2, '0');
                const monthTransactions = yearTransactions.filter(t => t.date.slice(5, 7) === monthStr);
                const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                const monthBalance = monthIncome - monthExpenses;

                if (monthTransactions.length > 0) {
                    breakdownHTML += `
                <div class="month-item">
                    <span>${months[month - 1]} ${selectedYear}</span>
                    <span>Income: $${monthIncome.toFixed(2)} | Expenses: $${monthExpenses.toFixed(2)} | Balance: <span class="${monthBalance >= 0 ? 'positive' : 'negative'}">$${monthBalance.toFixed(2)}</span></span>
                </div>
            `;
                }
            }

            monthlyBreakdown.innerHTML = breakdownHTML;
        }

        // Render transactions table
        function renderTransactions() {
            const tbody = document.getElementById('transactionsBody');
            const typeFilter = document.getElementById('typeFilter').value;
            const categoryFilter = document.getElementById('categoryFilter').value;

            let filteredTransactions = transactions.filter(t => {
                if (typeFilter !== 'all' && t.type !== typeFilter) return false;
                if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
                return true;
            });

            // Sort by date (newest first)
            filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (filteredTransactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">No transactions found</td></tr>';
                return;
            }

            tbody.innerHTML = filteredTransactions.map(t => `
        <tr>
            <td>${new Date(t.date).toLocaleDateString()}</td>
            <td>${t.description}</td>
            <td><span class="badge badge-${t.type}">${t.type}</span></td>
            <td>${t.category}</td>
            <td class="${t.type === 'income' ? 'positive' : 'negative'}">$${t.amount.toFixed(2)}</td>
            <td>
                <button class="action-btn" onclick="editTransaction(${t.id})">Edit</button>
                <button class="action-btn" onclick="deleteTransaction(${t.id})">Delete</button>
            </td>
        </tr>
    `).join('');
        }

        // Filter transactions
        function filterTransactions() {
            renderTransactions();
        }

        // Update category filters
        function updateCategoryFilters() {
            const categoryFilter = document.getElementById('categoryFilter');
            const categories = [...new Set(transactions.map(t => t.category))];

            // Keep "All Categories" option and add existing categories
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="all">All Categories</option>';

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });

            categoryFilter.value = currentValue;
        }

        // Edit transaction
        function editTransaction(id) {
            const transaction = transactions.find(t => t.id === id);
            if (!transaction) return;

            if (transaction.type === 'expense') {
                document.getElementById('expenseDescription').value = transaction.description;
                document.getElementById('expenseAmount').value = transaction.amount;
                document.getElementById('expenseCategory').value = transaction.category;
                document.getElementById('expenseDate').value = transaction.date;

                if (transaction.category === 'Other' && transaction.customDescription) {
                    document.getElementById('expenseCustomDescription').value = transaction.customDescription;
                    document.getElementById('expenseCustom').style.display = 'block';
                }

                switchTab('expense');
            } else {
                document.getElementById('incomeDescription').value = transaction.description;
                document.getElementById('incomeAmount').value = transaction.amount;
                document.getElementById('incomeCategory').value = transaction.category;
                document.getElementById('incomeDate').value = transaction.date;

                if (transaction.category === 'Other' && transaction.customDescription) {
                    document.getElementById('incomeCustomDescription').value = transaction.customDescription;
                    document.getElementById('incomeCustom').style.display = 'block';
                }

                switchTab('income');
            }

            deleteTransaction(id);
        }

        // Delete transaction
        function deleteTransaction(id) {
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
            updateSummary();
            updateCharts();
            renderTransactions();
            updateCategoryFilters();

            if (currentView === 'yearly') {
                updateYearlyReport();
            }
        }

        // Download data
        function downloadData(type) {
            let data, filename;

            if (type === 'monthly') {
                const selectedMonth = document.getElementById('monthSelector').value;
                data = transactions.filter(t => t.date.slice(0, 7) === selectedMonth);
                filename = `monthly-report-${selectedMonth}.json`;
            } else {
                const selectedYear = document.getElementById('yearSelector').value;
                data = transactions.filter(t => t.date.slice(0, 4) === selectedYear);
                filename = `yearly-report-${selectedYear}.json`;
            }

            // Create organized data structure
            const organizedData = {
                period: type === 'monthly' ? document.getElementById('monthSelector').value : document.getElementById('yearSelector').value,
                summary: {
                    totalIncome: data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                    totalExpenses: data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
                    transactionCount: data.length
                },
                transactions: data.sort((a, b) => new Date(b.date) - new Date(a.date)),
                categoryBreakdown: getCategoryBreakdown(data)
            };

            // Download as JSON
            const blob = new Blob([JSON.stringify(organizedData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Get category breakdown
        function getCategoryBreakdown(data) {
            const breakdown = {};

            data.forEach(t => {
                if (!breakdown[t.category]) {
                    breakdown[t.category] = { income: 0, expenses: 0, count: 0 };
                }

                if (t.type === 'income') {
                    breakdown[t.category].income += t.amount;
                } else {
                    breakdown[t.category].expenses += t.amount;
                }

                breakdown[t.category].count++;
            });

            return breakdown;
        }
        function downloadData(type) {
            let data, filename;
            let txtContent = ""; // This will hold our formatted text content

            if (type === 'monthly') {
                const selectedMonth = document.getElementById('monthSelector').value;
                data = transactions.filter(t => t.date.slice(0, 7) === selectedMonth);
                filename = `monthly-report-${selectedMonth}.txt`;

                // Create header for monthly report
                txtContent += `Monthly Financial Report - ${selectedMonth}\n`;
                txtContent += "=".repeat(40) + "\n\n";
            } else {
                const selectedYear = document.getElementById('yearSelector').value;
                data = transactions.filter(t => t.date.slice(0, 4) === selectedYear);
                filename = `yearly-report-${selectedYear}.txt`;

                // Create header for yearly report
                txtContent += `Yearly Financial Report - ${selectedYear}\n`;
                txtContent += "=".repeat(40) + "\n\n";
            }

            // Calculate summary
            const totalIncome = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const balance = totalIncome - totalExpenses;
            const transactionCount = data.length;

            // Add summary section
            txtContent += "SUMMARY\n";
            txtContent += "-".repeat(40) + "\n";
            txtContent += `Total Income: $${totalIncome.toFixed(2)}\n`;
            txtContent += `Total Expenses: $${totalExpenses.toFixed(2)}\n`;
            txtContent += `Balance: $${balance.toFixed(2)}\n`;
            txtContent += `Total Transactions: ${transactionCount}\n\n`;

            // Add transactions section
            txtContent += "TRANSACTIONS\n";
            txtContent += "-".repeat(40) + "\n";

            // Sort transactions by date (newest first)
            const sortedTransactions = data.sort((a, b) => new Date(b.date) - new Date(a.date));

            sortedTransactions.forEach((t, index) => {
                txtContent += `${index + 1}. ${new Date(t.date).toLocaleDateString()} - ${t.description}\n`;
                txtContent += `   Type: ${t.type.toUpperCase()}, Category: ${t.category}\n`;
                txtContent += `   Amount: $${t.amount.toFixed(2)}\n\n`;
            });

            // Add category breakdown section
            txtContent += "CATEGORY BREAKDOWN\n";
            txtContent += "-".repeat(40) + "\n";

            const categoryBreakdown = {};
            data.forEach(t => {
                if (!categoryBreakdown[t.category]) {
                    categoryBreakdown[t.category] = { income: 0, expenses: 0, count: 0 };
                }
                if (t.type === 'income') {
                    categoryBreakdown[t.category].income += t.amount;
                } else {
                    categoryBreakdown[t.category].expenses += t.amount;
                }
                categoryBreakdown[t.category].count++;
            });

            for (const category in categoryBreakdown) {
                const breakdown = categoryBreakdown[category];
                txtContent += `${category}:\n`;
                txtContent += `  Transactions: ${breakdown.count}\n`;
                if (breakdown.income > 0) {
                    txtContent += `  Income: $${breakdown.income.toFixed(2)}\n`;
                }
                if (breakdown.expenses > 0) {
                    txtContent += `  Expenses: $${breakdown.expenses.toFixed(2)}\n`;
                }
                txtContent += "\n";
            }

            // Create and download the TXT file
            const blob = new Blob([txtContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        // Handle expense form submission
        function handleExpenseSubmit(e) {
            e.preventDefault();

            const description = document.getElementById('expenseDescription').value;
            const amount = parseFloat(document.getElementById('expenseAmount').value);
            const category = document.getElementById('expenseCategory').value;
            const date = document.getElementById('expenseDate').value;
            const customDescription = document.getElementById('expenseCustomDescription').value;

            const transaction = {
                id: window.editingTransactionId || Date.now(), // Use existing ID if editing
                description: category === 'Other' && customDescription ? customDescription : description,
                amount: amount,
                category: category,
                date: date,
                type: 'expense',
                customDescription: category === 'Other' ? customDescription : null
            };

            if (window.editingTransactionId) {
                // Update existing transaction
                const index = transactions.findIndex(t => t.id === window.editingTransactionId);
                if (index !== -1) {
                    transactions[index] = transaction;
                }
                window.editingTransactionId = null; // Reset editing flag
            } else {
                // Add new transaction
                transactions.push(transaction);
            }

            saveTransactions();
            updateSummary();
            updateCharts();
            renderTransactions();
            updateCategoryFilters();

            document.getElementById('expenseForm').reset();
            document.getElementById('expenseCustom').style.display = 'none';
            document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        }

        // Handle income form submission
        function handleIncomeSubmit(e) {
            e.preventDefault();

            const description = document.getElementById('incomeDescription').value;
            const amount = parseFloat(document.getElementById('incomeAmount').value);
            const category = document.getElementById('incomeCategory').value;
            const date = document.getElementById('incomeDate').value;
            const customDescription = document.getElementById('incomeCustomDescription').value;

            const transaction = {
                id: window.editingTransactionId || Date.now(), // Use existing ID if editing
                description: category === 'Other' && customDescription ? customDescription : description,
                amount: amount,
                category: category,
                date: date,
                type: 'income',
                customDescription: category === 'Other' ? customDescription : null
            };

            if (window.editingTransactionId) {
                // Update existing transaction
                const index = transactions.findIndex(t => t.id === window.editingTransactionId);
                if (index !== -1) {
                    transactions[index] = transaction;
                }
                window.editingTransactionId = null; // Reset editing flag
            } else {
                // Add new transaction
                transactions.push(transaction);
            }

            saveTransactions();
            updateSummary();
            updateCharts();
            renderTransactions();
            updateCategoryFilters();

            document.getElementById('incomeForm').reset();
            document.getElementById('incomeCustom').style.display = 'none';
            document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
        }
        function initializeCharts() {
            const barCtx = document.getElementById('barChart').getContext('2d');
            const pieCtx = document.getElementById('pieChart').getContext('2d');

            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Income',
                        data: [],
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Expenses',
                        data: [],
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        },
                        x: {
                            ticks: {
                                maxRotation: 0, // Force horizontal labels
                                minRotation: 0  // Force horizontal labels
                            }
                        }
                    }
                }
            });

            pieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        options: {
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 10 // Smaller font size
                        }
                    }
                }
            }
        }
        // Add this to your existing JavaScript
        document.addEventListener('DOMContentLoaded', function () {
            const themeToggle = document.getElementById('themeToggle');
            const themeIcon = document.querySelector('.theme-icon');

            // Check for saved theme preference or use preferred color scheme
            const savedTheme = localStorage.getItem('theme') ||
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

            // Apply the saved theme
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                themeIcon.textContent = '☀️';
                themeToggle.innerHTML = '<span class="theme-icon">☀️</span> Light Mode';
            }

            // Toggle theme on button click
            themeToggle.addEventListener('click', function () {
                document.body.classList.toggle('dark-theme');
                const isDark = document.body.classList.contains('dark-theme');

                if (isDark) {
                    themeIcon.textContent = '☀️';
                    this.innerHTML = '<span class="theme-icon">☀️</span> Light Mode';
                    localStorage.setItem('theme', 'dark');
                } else {
                    themeIcon.textContent = '🌙';
                    this.innerHTML = '<span class="theme-icon">🌙</span> Dark Mode';
                    localStorage.setItem('theme', 'light');
                }
            });
        });