/**
 * Custom JavaScript for Fantoccini Documentation
 */

(function() {
    'use strict';

    // Add smooth scrolling to anchor links
    document.addEventListener('DOMContentLoaded', function() {
        // Smooth scrolling for internal links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add copy-to-clipboard functionality for code blocks
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            const container = block.parentElement;
            const button = document.createElement('button');
            button.className = 'copy-button';
            button.textContent = 'Copy';
            button.setAttribute('aria-label', 'Copy code to clipboard');
            
            container.style.position = 'relative';
            container.appendChild(button);
            
            button.addEventListener('click', async function() {
                try {
                    await navigator.clipboard.writeText(block.textContent);
                    button.textContent = 'Copied!';
                    button.style.background = '#10b981';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                        button.style.background = '';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    button.textContent = 'Failed';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                    }, 2000);
                }
            });
        });

        // Add theme toggle functionality
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '🌓';
        themeToggle.setAttribute('aria-label', 'Toggle dark mode');
        themeToggle.title = 'Toggle dark/light theme';
        
        const navHeader = document.querySelector('.nav-header');
        if (navHeader) {
            navHeader.appendChild(themeToggle);
        }

        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('fantoccini-theme') || 'default';
        document.body.setAttribute('data-type', savedTheme);

        themeToggle.addEventListener('click', function() {
            const currentTheme = document.body.getAttribute('data-type');
            const newTheme = currentTheme === 'dark' ? 'default' : 'dark';
            
            document.body.setAttribute('data-type', newTheme);
            localStorage.setItem('fantoccini-theme', newTheme);
        });

        // Add search functionality
        addSearchFunctionality();

        // Highlight current page in navigation
        highlightCurrentPage();

        // Add expand/collapse for method signatures
        addMethodSignatureToggle();

        // Add keyboard navigation
        addKeyboardNavigation();
    });

    function addSearchFunctionality() {
        const nav = document.querySelector('nav');
        if (!nav) return;

        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" class="search-input" placeholder="Search documentation..." />
            <div class="search-results"></div>
        `;

        nav.insertBefore(searchContainer, nav.firstChild.nextSibling);

        const searchInput = searchContainer.querySelector('.search-input');
        const searchResults = searchContainer.querySelector('.search-results');
        
        // Collect all searchable items
        const searchableItems = [];
        const links = nav.querySelectorAll('a');
        links.forEach(link => {
            searchableItems.push({
                title: link.textContent.trim(),
                href: link.getAttribute('href'),
                element: link
            });
        });

        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.toLowerCase();
            
            searchTimeout = setTimeout(() => {
                if (query.length < 2) {
                    searchResults.style.display = 'none';
                    return;
                }

                const matches = searchableItems.filter(item => 
                    item.title.toLowerCase().includes(query)
                );

                if (matches.length > 0) {
                    searchResults.innerHTML = matches.slice(0, 5).map(item => 
                        `<a href="${item.href}" class="search-result">${item.title}</a>`
                    ).join('');
                    searchResults.style.display = 'block';
                } else {
                    searchResults.innerHTML = '<div class="no-results">No results found</div>';
                    searchResults.style.display = 'block';
                }
            }, 300);
        });

        // Hide search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchContainer.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    function highlightCurrentPage() {
        const currentPath = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('nav a');
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPath || 
                (currentPath === '' && linkPath === 'index.html')) {
                link.classList.add('current-page');
            }
        });
    }

    function addMethodSignatureToggle() {
        const methodHeaders = document.querySelectorAll('h4.name');
        methodHeaders.forEach(header => {
            const details = header.nextElementSibling;
            if (details && details.classList.contains('details')) {
                header.style.cursor = 'pointer';
                header.addEventListener('click', function() {
                    details.style.display = details.style.display === 'none' ? '' : 'none';
                    header.classList.toggle('collapsed');
                });
            }
        });
    }

    function addKeyboardNavigation() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape to close search results
            if (e.key === 'Escape') {
                const searchResults = document.querySelector('.search-results');
                if (searchResults) {
                    searchResults.style.display = 'none';
                }
            }
        });
    }

    // Add loading animation for better UX
    window.addEventListener('beforeunload', function() {
        document.body.style.opacity = '0.8';
    });

    // Add scroll progress indicator
    function addScrollProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = progress + '%';
        });
    }

    if (document.body.scrollHeight > window.innerHeight * 1.5) {
        addScrollProgress();
    }

})();