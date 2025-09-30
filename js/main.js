// Global state
let currentUser = null;
let allArtists = [];
let filteredArtists = [];
let currentFilters = {
    search: '',
    specializations: [],
    genres: [],
    styles: [],
    experience: 'any',
    availability: []
};
let currentSort = 'rating';
let currentPage = 1;
const itemsPerPage = 12;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadArtists();
    setupEventListeners();
});

// Initialize application
function initializeApp() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
    
    // Initialize filters
    initializeFilters();
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Filter checkboxes and radios
    const filterInputs = document.querySelectorAll('.filters-sidebar input');
    filterInputs.forEach(input => {
        input.addEventListener('change', handleFilterChange);
    });
    
    // Sort dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }
    
    // Mobile menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Mobile filter button
    const mobileFilterBtn = document.querySelector('.mobile-filter-btn');
    if (mobileFilterBtn) {
        mobileFilterBtn.addEventListener('click', toggleMobileFilters);
    }
}

// Initialize filters
function initializeFilters() {
    // Set default experience filter
    const experienceRadios = document.querySelectorAll('input[name="experience"]');
    experienceRadios.forEach(radio => {
        if (radio.value === 'any') {
            radio.checked = true;
        }
    });
}

// Load artists from database
async function loadArtists() {
    try {
        showLoading();
        
        // Fetch artists from the API
        const response = await fetch('tables/users?limit=100');
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            // Filter only artists and active users
            allArtists = data.data.filter(user => 
                user.user_type === 'artist' && 
                user.is_active === true
            );
            
            // If no artists found in API, use sample data
            if (allArtists.length === 0) {
                allArtists = generateSampleArtists();
            }
        } else {
            // If no data from API, use sample data
            allArtists = generateSampleArtists();
        }
        
        filteredArtists = [...allArtists];
        renderArtists();
        updateResultsCount();
        
    } catch (error) {
        console.error('Error loading artists:', error);
        // Use sample data as fallback
        allArtists = generateSampleArtists();
        filteredArtists = [...allArtists];
        renderArtists();
        updateResultsCount();
    }
}

// Generate sample artists for demo
function generateSampleArtists() {
    const sampleArtists = [
        {
            id: '1',
            full_name: 'Анна Смирнова',
            specializations: ['covers', 'illustrations'],
            genres: ['fantasy', 'romance'],
            styles: ['digital', 'realistic'],
            experience_level: '3+',
            availability_status: 'available',
            rating: 4.8,
            reviews_count: 23,
            completed_projects: 45,
            bio: 'Специализируюсь на обложках фантастических романов и детской литературы',
            profile_image: 'https://via.placeholder.com/300x200/e3f2fd/1976d2?text=Fantasy+Art',
            location: 'Москва',
            is_verified: true
        },
        {
            id: '2',
            full_name: 'Дмитрий Козлов',
            specializations: ['covers'],
            genres: ['detective', 'nonfiction'],
            styles: ['minimal', 'vintage'],
            experience_level: '1-3',
            availability_status: 'considering',
            rating: 4.6,
            reviews_count: 15,
            completed_projects: 28,
            bio: 'Минималистичный дизайн для детективов и бизнес-литературы',
            profile_image: 'https://via.placeholder.com/300x200/f3e5f5/7b1fa2?text=Minimal+Design',
            location: 'Санкт-Петербург',
            is_verified: true
        },
        {
            id: '3',
            full_name: 'Елена Васильева',
            specializations: ['illustrations', 'lettering'],
            genres: ['children', 'fantasy'],
            styles: ['cartoon', 'watercolor'],
            experience_level: '3+',
            availability_status: 'busy',
            rating: 4.9,
            reviews_count: 31,
            completed_projects: 67,
            bio: 'Детские иллюстрации и рукописные шрифты',
            profile_image: 'https://via.placeholder.com/300x200/fff3e0/ff8f00?text=Children+Art',
            location: 'Екатеринбург',
            is_verified: true
        },
        {
            id: '4',
            full_name: 'Александр Петров',
            specializations: ['covers'],
            genres: ['sci-fi', 'horror'],
            styles: ['digital', 'realistic'],
            experience_level: '3+',
            availability_status: 'available',
            rating: 4.7,
            reviews_count: 19,
            completed_projects: 38,
            bio: 'Атмосферные обложки для научной фантастики и хоррора',
            profile_image: 'https://via.placeholder.com/300x200/e8f5e8/2e7d32?text=Sci-Fi+Art',
            location: 'Новосибирск',
            is_verified: false
        },
        {
            id: '5',
            full_name: 'Мария Иванова',
            specializations: ['illustrations'],
            genres: ['romance', 'historical'],
            styles: ['oil', 'vintage'],
            experience_level: '1-3',
            availability_status: 'available',
            rating: 4.4,
            reviews_count: 8,
            completed_projects: 16,
            bio: 'Классические иллюстрации для исторических романов',
            profile_image: 'https://via.placeholder.com/300x200/fce4ec/c2185b?text=Historical+Art',
            location: 'Казань',
            is_verified: true
        },
        {
            id: '6',
            full_name: 'Игорь Морозов',
            specializations: ['covers', 'lettering'],
            genres: ['detective', 'thriller'],
            styles: ['minimal', 'vector'],
            experience_level: 'newcomer',
            availability_status: 'available',
            rating: 4.2,
            reviews_count: 5,
            completed_projects: 9,
            bio: 'Современный дизайн для детективной литературы',
            profile_image: 'https://via.placeholder.com/300x200/f1f8e9/689f38?text=Modern+Design',
            location: 'Ростов-на-Дону',
            is_verified: false
        }
    ];
    
    return sampleArtists;
}

// Handle search input
function handleSearch(event) {
    currentFilters.search = event.target.value.toLowerCase();
    applyFilters();
}

// Handle filter changes
function handleFilterChange(event) {
    const filterType = event.target.name;
    const filterValue = event.target.value;
    const isChecked = event.target.checked;
    
    if (filterType === 'experience') {
        if (isChecked) {
            currentFilters.experience = filterValue;
        }
    } else {
        if (isChecked) {
            currentFilters[filterType].push(filterValue);
        } else {
            const index = currentFilters[filterType].indexOf(filterValue);
            if (index > -1) {
                currentFilters[filterType].splice(index, 1);
            }
        }
    }
    
    applyFilters();
}

// Handle sort change
function handleSortChange(event) {
    currentSort = event.target.value;
    sortArtists();
    renderArtists();
}

// Apply all filters
function applyFilters() {
    filteredArtists = allArtists.filter(artist => {
        // Search filter
        if (currentFilters.search) {
            const searchLower = currentFilters.search.toLowerCase();
            const matchesSearch = 
                artist.full_name.toLowerCase().includes(searchLower) ||
                artist.bio.toLowerCase().includes(searchLower) ||
                artist.specializations.some(spec => spec.toLowerCase().includes(searchLower)) ||
                artist.genres.some(genre => genre.toLowerCase().includes(searchLower)) ||
                artist.styles.some(style => style.toLowerCase().includes(searchLower));
            
            if (!matchesSearch) return false;
        }
        
        // Specialization filter
        if (currentFilters.specializations.length > 0) {
            const hasSpecialization = currentFilters.specializations.some(spec => 
                artist.specializations.includes(spec)
            );
            if (!hasSpecialization) return false;
        }
        
        // Genre filter
        if (currentFilters.genres.length > 0) {
            const hasGenre = currentFilters.genres.some(genre => 
                artist.genres.includes(genre)
            );
            if (!hasGenre) return false;
        }
        
        // Style filter
        if (currentFilters.styles.length > 0) {
            const hasStyle = currentFilters.styles.some(style => 
                artist.styles.includes(style)
            );
            if (!hasStyle) return false;
        }
        
        // Experience filter
        if (currentFilters.experience !== 'any') {
            if (artist.experience_level !== currentFilters.experience) return false;
        }
        
        // Availability filter
        if (currentFilters.availability.length > 0) {
            if (!currentFilters.availability.includes(artist.availability_status)) return false;
        }
        
        return true;
    });
    
    sortArtists();
    renderArtists();
    updateResultsCount();
}

// Sort artists
function sortArtists() {
    filteredArtists.sort((a, b) => {
        switch (currentSort) {
            case 'rating':
                return b.rating - a.rating;
            case 'name':
                return a.full_name.localeCompare(b.full_name, 'ru');
            case 'recent':
                return new Date(b.last_active || b.created_at) - new Date(a.last_active || a.created_at);
            case 'popular':
                return b.completed_projects - a.completed_projects;
            default:
                return b.rating - a.rating;
        }
    });
}

// Render artists grid
function renderArtists() {
    const grid = document.getElementById('artistsGrid');
    if (!grid) return;
    
    if (filteredArtists.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить фильтры или поисковый запрос</p>
            </div>
        `;
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentArtists = filteredArtists.slice(startIndex, endIndex);
    
    grid.innerHTML = currentArtists.map(artist => createArtistCard(artist)).join('');
    
    // Update load more button
    updateLoadMoreButton();
}

// Create artist card HTML
function createArtistCard(artist) {
    const statusClass = `status-${artist.availability_status}`;
    const statusText = {
        'available': 'Свободен',
        'busy': 'Занят',
        'considering': 'Рассмотрит'
    };
    
    const stars = '★'.repeat(Math.floor(artist.rating)) + 
                 (artist.rating % 1 >= 0.5 ? '☆' : '') + 
                 '☆'.repeat(5 - Math.ceil(artist.rating));
    
    return `
        <div class="artist-card" onclick="openArtistProfile('${artist.id}')">
            <div class="artist-image">
                <img src="${artist.profile_image}" alt="${artist.full_name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="placeholder" style="display: none;">
                    <i class="fas fa-user"></i>
                </div>
                <div class="availability-status ${statusClass}" title="${statusText[artist.availability_status]}"></div>
            </div>
            <div class="artist-info">
                <div class="artist-name">
                    ${artist.full_name}
                    ${artist.is_verified ? '<i class="fas fa-check-circle" style="color: #007bff; font-size: 12px; margin-left: 4px;" title="Верифицирован"></i>' : ''}
                </div>
                <div class="artist-specialization">
                    ${formatSpecializations(artist.specializations)}
                </div>
                <div class="artist-rating">
                    <span class="stars">${stars}</span>
                    <span class="rating-text">${artist.rating} (${artist.reviews_count})</span>
                </div>
                <div class="artist-tags">
                    ${artist.genres.slice(0, 3).map(genre => `<span class="tag">${formatGenre(genre)}</span>`).join('')}
                    ${artist.genres.length > 3 ? `<span class="tag">+${artist.genres.length - 3}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Format specializations for display
function formatSpecializations(specializations) {
    const formatted = specializations.map(spec => {
        switch (spec) {
            case 'covers': return 'Обложки';
            case 'illustrations': return 'Иллюстрации';
            case 'lettering': return 'Леттеринг';
            case 'layout': return 'Внутренний макет';
            default: return spec;
        }
    });
    return formatted.join(', ');
}

// Format genre for display
function formatGenre(genre) {
    const genres = {
        'fantasy': 'Фантастика',
        'detective': 'Детективы',
        'children': 'Детская',
        'romance': 'Романы',
        'nonfiction': 'Нон-фикшн',
        'horror': 'Хоррор',
        'sci-fi': 'Sci-Fi',
        'historical': 'История'
    };
    return genres[genre] || genre;
}

// Update results count
function updateResultsCount() {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        const count = filteredArtists.length;
        const word = count === 1 ? 'творец' : count < 5 ? 'творца' : 'творцов';
        countElement.textContent = `Найдено: ${count} ${word}`;
    }
}

// Update load more button
function updateLoadMoreButton() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        const totalPages = Math.ceil(filteredArtists.length / itemsPerPage);
        if (currentPage >= totalPages) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }
}

// Load more artists
function loadMoreArtists() {
    currentPage++;
    renderArtists();
}

// Clear all filters
function clearFilters() {
    // Reset filter state
    currentFilters = {
        search: '',
        specializations: [],
        genres: [],
        styles: [],
        experience: 'any',
        availability: []
    };
    
    // Reset UI
    document.getElementById('searchInput').value = '';
    
    const checkboxes = document.querySelectorAll('.filters-sidebar input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    const radios = document.querySelectorAll('.filters-sidebar input[type="radio"]');
    radios.forEach(radio => {
        radio.checked = radio.value === 'any';
    });
    
    // Apply filters
    applyFilters();
}

// Open artist profile
function openArtistProfile(artistId) {
    // Navigate to profile page with artist ID
    window.location.href = `profile.html?id=${artistId}`;
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
        mobileNav.classList.toggle('active');
    }
}

// Mobile filters toggle
function toggleMobileFilters() {
    const sidebar = document.getElementById('filtersSidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// Show loading state
function showLoading() {
    const grid = document.getElementById('artistsGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner"></i>
                <p>Загрузка творцов...</p>
            </div>
        `;
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    // Hide login/register buttons, show user menu
    // This would be implemented based on the specific requirements
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for use in other files
window.loadMoreArtists = loadMoreArtists;
window.clearFilters = clearFilters;
window.openArtistProfile = openArtistProfile;
window.toggleMobileMenu = toggleMobileMenu;
window.toggleMobileFilters = toggleMobileFilters;
window.sortResults = handleSortChange;