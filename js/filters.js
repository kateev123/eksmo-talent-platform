// Advanced filtering system for the talent platform

class FilterManager {
    constructor() {
        this.activeFilters = new Map();
        this.savedFilters = new Map();
        this.filterHistory = [];
        this.debounceTimer = null;
    }

    // Initialize filter system
    init() {
        this.bindFilterEvents();
        this.loadSavedFilters();
        this.setupFilterPresets();
    }

    // Bind event listeners to filter controls
    bindFilterEvents() {
        // Real-time search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.debounceFilter(() => this.updateSearchFilter(e.target.value), 300);
            });
        }

        // Specialization filters
        document.querySelectorAll('input[name="specialization"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateArrayFilter('specializations', e.target.value, e.target.checked);
            });
        });

        // Genre filters
        document.querySelectorAll('input[name="genre"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateArrayFilter('genres', e.target.value, e.target.checked);
            });
        });

        // Style filters
        document.querySelectorAll('input[name="style"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateArrayFilter('styles', e.target.value, e.target.checked);
            });
        });

        // Experience level
        document.querySelectorAll('input[name="experience"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.updateSingleFilter('experience', e.target.value);
                }
            });
        });

        // Availability filters
        document.querySelectorAll('input[name="availability"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateArrayFilter('availability', e.target.value, e.target.checked);
            });
        });
    }

    // Update search filter
    updateSearchFilter(value) {
        if (value.trim()) {
            this.activeFilters.set('search', value.toLowerCase().trim());
        } else {
            this.activeFilters.delete('search');
        }
        this.applyFilters();
    }

    // Update array-based filter (checkboxes)
    updateArrayFilter(filterType, value, isChecked) {
        let currentValues = this.activeFilters.get(filterType) || [];
        
        if (isChecked) {
            if (!currentValues.includes(value)) {
                currentValues.push(value);
            }
        } else {
            currentValues = currentValues.filter(v => v !== value);
        }

        if (currentValues.length > 0) {
            this.activeFilters.set(filterType, currentValues);
        } else {
            this.activeFilters.delete(filterType);
        }

        this.applyFilters();
    }

    // Update single value filter (radio buttons)
    updateSingleFilter(filterType, value) {
        if (value === 'any' || !value) {
            this.activeFilters.delete(filterType);
        } else {
            this.activeFilters.set(filterType, value);
        }
        this.applyFilters();
    }

    // Apply all active filters
    applyFilters() {
        let filtered = [...allArtists];

        // Apply each active filter
        for (const [filterType, filterValue] of this.activeFilters) {
            filtered = this.applySpecificFilter(filtered, filterType, filterValue);
        }

        // Update global state
        filteredArtists = filtered;
        currentPage = 1;

        // Update UI
        this.updateFilterSummary();
        sortArtists();
        renderArtists();
        updateResultsCount();

        // Save current filter state
        this.saveCurrentFilters();
    }

    // Apply specific filter type
    applySpecificFilter(artists, filterType, filterValue) {
        switch (filterType) {
            case 'search':
                return this.filterBySearch(artists, filterValue);
            case 'specializations':
                return this.filterByArray(artists, 'specializations', filterValue);
            case 'genres':
                return this.filterByArray(artists, 'genres', filterValue);
            case 'styles':
                return this.filterByArray(artists, 'styles', filterValue);
            case 'experience':
                return this.filterByExperience(artists, filterValue);
            case 'availability':
                return this.filterByArray(artists, 'availability_status', filterValue, true);
            case 'rating':
                return this.filterByRating(artists, filterValue);
            case 'location':
                return this.filterByLocation(artists, filterValue);
            case 'verified':
                return this.filterByVerified(artists, filterValue);
            default:
                return artists;
        }
    }

    // Filter by search query
    filterBySearch(artists, query) {
        const searchTerms = query.split(' ').filter(term => term.length > 0);
        
        return artists.filter(artist => {
            const searchableText = [
                artist.full_name,
                artist.bio || '',
                artist.location || '',
                ...(artist.specializations || []),
                ...(artist.genres || []),
                ...(artist.styles || [])
            ].join(' ').toLowerCase();

            return searchTerms.every(term => searchableText.includes(term));
        });
    }

    // Filter by array values (specializations, genres, styles)
    filterByArray(artists, fieldName, requiredValues, isSingle = false) {
        return artists.filter(artist => {
            const artistValues = isSingle ? [artist[fieldName]] : (artist[fieldName] || []);
            return requiredValues.some(value => artistValues.includes(value));
        });
    }

    // Filter by experience level
    filterByExperience(artists, experienceLevel) {
        return artists.filter(artist => artist.experience_level === experienceLevel);
    }

    // Filter by rating range
    filterByRating(artists, ratingRange) {
        const [min, max] = ratingRange;
        return artists.filter(artist => 
            artist.rating >= min && artist.rating <= max
        );
    }

    // Filter by location
    filterByLocation(artists, location) {
        return artists.filter(artist => 
            artist.location && artist.location.toLowerCase().includes(location.toLowerCase())
        );
    }

    // Filter by verified status
    filterByVerified(artists, isVerified) {
        return artists.filter(artist => artist.is_verified === isVerified);
    }

    // Update filter summary display
    updateFilterSummary() {
        const summaryContainer = document.querySelector('.filter-summary');
        if (!summaryContainer) return;

        const activeFilterTags = [];

        for (const [filterType, filterValue] of this.activeFilters) {
            const tag = this.createFilterTag(filterType, filterValue);
            if (tag) activeFilterTags.push(tag);
        }

        if (activeFilterTags.length > 0) {
            summaryContainer.innerHTML = `
                <div class="active-filters">
                    <span class="filter-label">Активные фильтры:</span>
                    ${activeFilterTags.join('')}
                    <button class="clear-all-btn" onclick="filterManager.clearAllFilters()">
                        <i class="fas fa-times"></i> Очистить все
                    </button>
                </div>
            `;
            summaryContainer.style.display = 'block';
        } else {
            summaryContainer.style.display = 'none';
        }
    }

    // Create filter tag HTML
    createFilterTag(filterType, filterValue) {
        let displayText = '';
        
        switch (filterType) {
            case 'search':
                displayText = `"${filterValue}"`;
                break;
            case 'specializations':
                displayText = filterValue.map(v => formatSpecializations([v])).join(', ');
                break;
            case 'genres':
                displayText = filterValue.map(v => formatGenre(v)).join(', ');
                break;
            case 'styles':
                displayText = filterValue.join(', ');
                break;
            case 'experience':
                displayText = `Опыт: ${filterValue}`;
                break;
            case 'availability':
                displayText = filterValue.join(', ');
                break;
            default:
                displayText = filterValue;
        }

        return `
            <span class="filter-tag" data-filter="${filterType}">
                ${displayText}
                <button onclick="filterManager.removeFilter('${filterType}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `;
    }

    // Remove specific filter
    removeFilter(filterType) {
        this.activeFilters.delete(filterType);
        this.updateUIForRemovedFilter(filterType);
        this.applyFilters();
    }

    // Update UI when filter is removed
    updateUIForRemovedFilter(filterType) {
        switch (filterType) {
            case 'search':
                document.getElementById('searchInput').value = '';
                break;
            case 'experience':
                document.querySelector('input[name="experience"][value="any"]').checked = true;
                break;
            default:
                // For checkbox filters
                document.querySelectorAll(`input[name="${filterType.slice(0, -1)}"]`).forEach(input => {
                    input.checked = false;
                });
        }
    }

    // Clear all filters
    clearAllFilters() {
        this.activeFilters.clear();
        this.resetAllFilterControls();
        this.applyFilters();
    }

    // Reset all filter control UI elements
    resetAllFilterControls() {
        // Clear search
        document.getElementById('searchInput').value = '';
        
        // Uncheck all checkboxes
        document.querySelectorAll('.filters-sidebar input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Reset experience radio to "any"
        document.querySelectorAll('input[name="experience"]').forEach(radio => {
            radio.checked = radio.value === 'any';
        });
    }

    // Setup filter presets
    setupFilterPresets() {
        const presets = [
            {
                name: 'Топ дизайнеры',
                filters: {
                    rating: [4.5, 5.0],
                    specializations: ['covers']
                }
            },
            {
                name: 'Детская литература',
                filters: {
                    genres: ['children'],
                    styles: ['cartoon', 'watercolor']
                }
            },
            {
                name: 'Свободны сейчас',
                filters: {
                    availability: ['available']
                }
            }
        ];

        // Add preset buttons to UI if container exists
        const presetContainer = document.querySelector('.filter-presets');
        if (presetContainer) {
            presetContainer.innerHTML = presets.map(preset => `
                <button class="preset-btn" onclick="filterManager.applyPreset('${preset.name}')">
                    ${preset.name}
                </button>
            `).join('');
        }
    }

    // Apply filter preset
    applyPreset(presetName) {
        const presets = {
            'Топ дизайнеры': {
                rating: [4.5, 5.0],
                specializations: ['covers']
            },
            'Детская литература': {
                genres: ['children'],
                styles: ['cartoon', 'watercolor']
            },
            'Свободны сейчас': {
                availability: ['available']
            }
        };

        const preset = presets[presetName];
        if (preset) {
            this.clearAllFilters();
            
            for (const [filterType, filterValue] of Object.entries(preset)) {
                this.activeFilters.set(filterType, filterValue);
            }
            
            this.applyFilters();
            this.updateUIForPreset(preset);
        }
    }

    // Update UI to match preset
    updateUIForPreset(preset) {
        // This would update checkboxes and other controls to match the preset
        // Implementation depends on specific preset structure
    }

    // Save current filters to localStorage
    saveCurrentFilters() {
        const filtersObj = Object.fromEntries(this.activeFilters);
        localStorage.setItem('exmo_talent_filters', JSON.stringify(filtersObj));
    }

    // Load saved filters from localStorage
    loadSavedFilters() {
        const saved = localStorage.getItem('exmo_talent_filters');
        if (saved) {
            try {
                const filtersObj = JSON.parse(saved);
                this.activeFilters = new Map(Object.entries(filtersObj));
                this.updateUIFromSavedFilters();
            } catch (error) {
                console.error('Error loading saved filters:', error);
            }
        }
    }

    // Update UI from saved filters
    updateUIFromSavedFilters() {
        for (const [filterType, filterValue] of this.activeFilters) {
            switch (filterType) {
                case 'search':
                    document.getElementById('searchInput').value = filterValue;
                    break;
                // Add other filter types as needed
            }
        }
    }

    // Debounce utility for performance
    debounceFilter(func, delay) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, delay);
    }

    // Export current filter state
    exportFilters() {
        return Object.fromEntries(this.activeFilters);
    }

    // Import filter state
    importFilters(filtersObj) {
        this.activeFilters = new Map(Object.entries(filtersObj));
        this.applyFilters();
        this.updateUIFromSavedFilters();
    }
}

// Initialize filter manager
const filterManager = new FilterManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure main.js has loaded
    setTimeout(() => {
        if (typeof allArtists !== 'undefined') {
            filterManager.init();
        }
    }, 100);
});

// Export for global use
window.filterManager = filterManager;