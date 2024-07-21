document.addEventListener('DOMContentLoaded', () => {
    const moneyElement = document.getElementById('money');
    const buyStockButton = document.getElementById('buy-stock');
    const sellStockButton = document.getElementById('sell-stock');
    const resetButton = document.getElementById('reset-button'); // Reset button
    const ctx = document.getElementById('stockChart').getContext('2d');
    const currentPriceElement = document.getElementById('current-price');
    const sharesOwnedElement = document.getElementById('shares-owned');
    const profitLossElement = document.getElementById('profit-loss'); // Profit/Loss display

    // Initialize variables
    let money = 1000; // Default value
    let stockPrices = {
        'CompanyA': [],
        'CompanyB': [],
        'CompanyC': []
    };
    let sharesOwned = {
        'CompanyA': 0,
        'CompanyB': 0,
        'CompanyC': 0
    };
    let chart;
    let marketOpen = true; // Track if the market is open
    let updateCount = 0; // Count the number of updates
    let selectedCompany = 'CompanyA'; // Default selected company

    // Initialize stock prices with random values between 80 and 120
    const initializeStockPrices = () => {
        for (let company in stockPrices) {
            stockPrices[company].push(Math.floor(Math.random() * 41) + 80); // Random price between 80 and 120
        }
    };

    // Load player progress from localStorage
    const loadProgress = () => {
        const savedMoney = localStorage.getItem('money');
        const savedShares = localStorage.getItem('sharesOwned');

        if (savedMoney) {
            money = parseFloat(savedMoney); // Update money to saved value
        }

        if (savedShares) {
            sharesOwned = JSON.parse(savedShares); // Update shares owned
        }
    };

    // Save player progress to localStorage
    const saveProgress = () => {
        localStorage.setItem('money', money); // Save money
        localStorage.setItem('sharesOwned', JSON.stringify(sharesOwned)); // Save shares owned
    };

    const updateStockPrices = () => {
        if (!marketOpen) return; // If market is closed, do not update prices

        for (let company in stockPrices) {
            const lastPrice = stockPrices[company][stockPrices[company].length - 1];
            const change = (Math.random() - 0.5) * 10; // Random change between -5 and 5
            const newPrice = Math.max(0, lastPrice + change); // Ensure price doesn't go below 0
            stockPrices[company].push(newPrice);
            
            if (stockPrices[company].length > 20) {
                stockPrices[company].shift();
            }
        }
        updateCount++; // Increment the update count

        // Check if the market should close
        if (updateCount >= 20) {
            marketOpen = false; // Close the market
            showAlert("The market is now closed. You have lost your purchased stocks.");
            // Reset shares owned to zero
            for (let company in sharesOwned) {
                sharesOwned[company] = 0;
            }
            updateMoney(); // Update displayed money
            updateChart(selectedCompany); // Update chart to reflect changes
            setTimeout(() => {
                location.reload(); // Reload the page after a short delay
            }, 2000); // 2 seconds delay before reloading
        }
    };

    const createChart = (company) => {
        const ctx = document.getElementById('stockChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(54, 162, 235, 0.8)');
        gradient.addColorStop(1, 'rgba(54, 162, 235, 0.2)');

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(20).fill().map((_, i) => i + 1),
                datasets: [{
                    label: `${company} Stock Price`,
                    data: stockPrices[company],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Time',
                            color: '#666',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        title: {
                            display: true,
                            text: 'Stock Price ($)',
                            color: '#666',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 14
                        },
                        padding: 10,
                        displayColors: false
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    };

    const updateChart = (company) => {
        chart.data.datasets[0].data = stockPrices[company];
        chart.data.datasets[0].label = `${company} Stock Price`;
        
        // Update y-axis to fit new data range
        const minPrice = Math.min(...stockPrices[company]);
        const maxPrice = Math.max(...stockPrices[company]);
        const range = maxPrice - minPrice;
        chart.options.scales.y.min = Math.max(0, minPrice - range * 0.1);
        chart.options.scales.y.max = maxPrice + range * 0.1;

        chart.update();

        const currentPrice = stockPrices[company][stockPrices[company].length - 1];
        updatePriceDisplay(currentPriceElement, parseFloat(currentPriceElement.textContent.split('$')[1]), currentPrice);
        sharesOwnedElement.textContent = `Shares Owned: ${sharesOwned[company]}`;
        
        // Calculate and display profit/loss
        calculateProfitLoss(company);
    };

    const updateMoney = () => {
        moneyElement.textContent = money.toFixed(2);
        saveProgress(); // Save progress whenever money is updated
    };

    const calculateProfitLoss = (company) => {
        const currentPrice = stockPrices[company][stockPrices[company].length - 1];
        const purchasePrice = stockPrices[company][0]; // Assuming the first price is the purchase price
        const shares = sharesOwned[company];

        const profitLoss = (currentPrice - purchasePrice) * shares;
        profitLossElement.textContent = `Profit/Loss for ${company}: $${profitLoss.toFixed(2)}`;

        // Change color based on profit/loss
        if (profitLoss > 0) {
            profitLossElement.style.color = 'green'; // Profit
        } else if (profitLoss < 0) {
            profitLossElement.style.color = 'red'; // Loss
        } else {
            profitLossElement.style.color = 'black'; // No profit/loss
        }
    };

    const showNotification = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    };

    const updatePriceDisplay = (element, oldPrice, newPrice) => {
        element.textContent = `Current Price: $${newPrice.toFixed(2)}`;
        element.classList.remove('price-up', 'price-down');
        element.classList.add(newPrice > oldPrice ? 'price-up' : 'price-down');
    };

    const showCelebration = () => {
        const celebrationElement = document.getElementById('celebration');
        celebrationElement.classList.remove('hidden');
        celebrationElement.classList.add('show');

        // Hide the celebration after a few seconds
        setTimeout(() => {
            celebrationElement.classList.remove('show');
            celebrationElement.classList.add('hidden');
        }, 3000); // Show for 3 seconds
    };

    // Reset progress functionality
    const resetProgress = () => {
        if (confirm("Warning: You will lose your progress. Do you want to continue?")) {
            money = 1000; // Reset money to initial value
            sharesOwned = { 'CompanyA': 0, 'CompanyB': 0, 'CompanyC': 0 }; // Reset shares
            stockPrices = {
                'CompanyA': [],
                'CompanyB': [],
                'CompanyC': []
            }; // Reset stock prices
            initializeStockPrices(); // Reinitialize stock prices
            updateMoney(); // Update displayed money
            saveProgress(); // Save reset progress
            updateChart(selectedCompany); // Update chart to reflect changes
            showNotification("Progress has been reset.");
        }
    };

// Add event listener for reset button
resetButton.addEventListener('click', resetProgress);

    // Handle company button clicks
    const companyButtons = document.querySelectorAll('.company-button');
    companyButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectedCompany = button.getAttribute('data-company'); // Get the selected company
            // Highlight selected button
            companyButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            updateChart(selectedCompany); // Update chart for the selected company
        });
    });



    loadProgress(); // Load player progress when the game starts
    initializeStockPrices(); // Initialize stock prices with random values
    updateMoney(); // Update the displayed money after loading progress
    createChart(selectedCompany); // Create chart for the default selected company

    // Update prices and chart every 10 seconds
    setInterval(() => {
        updateStockPrices();
        updateChart(selectedCompany); // Update chart for the selected company
    }, 5000); // 10,000 milliseconds = 10 seconds

    // Buy stock functionality
    buyStockButton.addEventListener('click', () => {
        const stockPrice = stockPrices[selectedCompany][stockPrices[selectedCompany].length - 1];
        if (money >= stockPrice) {
            money -= stockPrice;
            sharesOwned[selectedCompany]++;
            updateMoney();
            updateChart(selectedCompany);
            showNotification(`Bought 1 share of ${selectedCompany} at $${stockPrice.toFixed(2)}`);
        } else {
            showNotification('Not enough money to buy stock');
        }
    });

    // Sell stock functionality
    sellStockButton.addEventListener('click', () => {
        if (sharesOwned[selectedCompany] > 0) {
            const stockPrice = stockPrices[selectedCompany][stockPrices[selectedCompany].length - 1];
            const purchasePrice = stockPrices[selectedCompany][0]; // Get the initial purchase price
            money += stockPrice;
            sharesOwned[selectedCompany]--;

            updateMoney();
            updateChart(selectedCompany);

            if (stockPrice > purchasePrice) {
                showCelebration(); // Trigger celebration if profit is made
            }

            showNotification(`Sold 1 share of ${selectedCompany} at $${stockPrice.toFixed(2)}`);
        } else {
            showNotification('No shares to sell for this company');
        }
    });
});