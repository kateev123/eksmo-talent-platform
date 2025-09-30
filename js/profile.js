// Profile page functionality

class ProfileManager {
    constructor() {
        this.currentArtistId = null;
        this.currentArtist = null;
        this.currentTab = 'portfolio';
        this.portfolioFilter = 'all';
        this.reviews = [];
        this.selectedRating = 0;
    }

    // Initialize profile page
    async init() {
        // Get artist ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.currentArtistId = urlParams.get('id');
        
        if (!this.currentArtistId) {
            // If no ID, redirect to main page or show error
            window.location.href = 'index.html';
            return;
        }

        await this.loadArtistData();
        this.setupEventListeners();
    }

    // Load artist data
    async loadArtistData() {
        try {
            // Try to load from API
            const response = await fetch(`tables/users/${this.currentArtistId}`);
            
            if (response.ok) {
                this.currentArtist = await response.json();
            } else {
                // Fallback to sample data
                this.currentArtist = this.getSampleArtist(this.currentArtistId);
            }

            if (this.currentArtist) {
                this.renderProfile();
                await this.loadReviews();
                this.loadPortfolio();
            } else {
                this.showError('Художник не найден');
            }
            
        } catch (error) {
            console.error('Error loading artist:', error);
            // Use sample data as fallback
            this.currentArtist = this.getSampleArtist(this.currentArtistId);
            this.renderProfile();
            this.loadSampleReviews();
            this.loadSamplePortfolio();
        }
    }

    // Get sample artist data
    getSampleArtist(artistId) {
        const sampleArtists = {
            '1': {
                id: '1',
                full_name: 'Анна Смирнова',
                email: 'anna.smirnova@email.com',
                specializations: ['covers', 'illustrations'],
                genres: ['fantasy', 'romance'],
                styles: ['digital', 'realistic'],
                experience_level: '3+',
                availability_status: 'available',
                rating: 4.8,
                reviews_count: 23,
                completed_projects: 45,
                bio: 'Специализируюсь на создании атмосферных обложек для фантастических романов и детской литературы. Работаю в цифровой технике, предпочитаю реалистичный стиль с элементами фэнтези. Имею опыт работы с крупными издательствами, включая создание серийных обложек.',
                profile_image: 'https://via.placeholder.com/120x120/e3f2fd/1976d2?text=AS',
                location: 'Москва',
                contact_phone: '+7 (999) 123-45-67',
                contact_telegram: '@anna_art',
                is_verified: true,
                portfolio_url: 'https://portfolio.example.com/anna'
            },
            '2': {
                id: '2',
                full_name: 'Дмитрий Козлов',
                email: 'dmitry.kozlov@email.com',
                specializations: ['covers'],
                genres: ['detective', 'nonfiction'],
                styles: ['minimal', 'vintage'],
                experience_level: '1-3',
                availability_status: 'considering',
                rating: 4.6,
                reviews_count: 15,
                completed_projects: 28,
                bio: 'Создаю минималистичные обложки для детективной и деловой литературы. Мой подход основан на чистых линиях, выразительной типографике и сильных композициях.',
                profile_image: 'https://via.placeholder.com/120x120/f3e5f5/7b1fa2?text=DK',
                location: 'Санкт-Петербург',
                contact_telegram: '@dmitry_design',
                is_verified: true
            }
        };
        
        return sampleArtists[artistId] || sampleArtists['1'];
    }

    // Render profile information
    renderProfile() {
        const artist = this.currentArtist;
        
        // Basic info
        document.getElementById('profileImage').src = artist.profile_image;
        document.getElementById('profileName').textContent = artist.full_name;
        
        // Verification badge
        if (artist.is_verified) {
            document.getElementById('verifiedBadge').style.display = 'flex';
        }
        
        // Specializations
        document.getElementById('profileSpecs').textContent = 
            this.formatSpecializations(artist.specializations);
        
        // Location
        if (artist.location) {
            document.getElementById('profileLocation').innerHTML = 
                `<i class="fas fa-map-marker-alt"></i> ${artist.location}`;
        }
        
        // Rating
        this.renderRating('ratingStars', artist.rating);
        document.getElementById('ratingText').textContent = 
            `${artist.rating} (${artist.reviews_count} отзывов)`;
        
        // Stats
        document.getElementById('completedProjects').textContent = artist.completed_projects;
        document.getElementById('experienceYears').textContent = 
            this.formatExperience(artist.experience_level);
        
        // Availability
        this.renderAvailability(artist.availability_status);
        
        // About tab content
        document.getElementById('artistBio').textContent = artist.bio;
        this.renderSkills(artist);
        this.renderGenres(artist.genres);
        this.renderContactInfo(artist);
        
        // Update reviews count in tab
        document.getElementById('reviewsCount').textContent = `(${artist.reviews_count})`;
    }

    // Render rating stars
    renderRating(elementId, rating) {
        const element = document.getElementById(elementId);
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '★';
        }
        if (hasHalfStar) {
            starsHtml += '☆';
        }
        for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
            starsHtml += '☆';
        }
        
        element.textContent = starsHtml;
    }

    // Format specializations for display
    formatSpecializations(specializations) {
        const formatted = specializations.map(spec => {
            switch (spec) {
                case 'covers': return 'Дизайн обложек';
                case 'illustrations': return 'Иллюстрации';
                case 'lettering': return 'Леттеринг';
                case 'layout': return 'Внутренний макет';
                default: return spec;
            }
        });
        return formatted.join(' • ');
    }

    // Format experience level
    formatExperience(experience) {
        switch (experience) {
            case 'newcomer': return 'Новичок';
            case '1-3': return '1-3 года';
            case '3+': return '3+ лет';
            default: return experience;
        }
    }

    // Render availability status
    renderAvailability(status) {
        const indicator = document.getElementById('availabilityIndicator');
        const text = document.getElementById('availabilityText');
        
        indicator.className = 'availability-indicator';
        
        switch (status) {
            case 'available':
                text.textContent = 'Доступен';
                break;
            case 'busy':
                indicator.classList.add('busy');
                text.textContent = 'Занят';
                break;
            case 'considering':
                indicator.classList.add('considering');
                text.textContent = 'Рассмотрит';
                break;
        }
    }

    // Render skills
    renderSkills(artist) {
        const skillsGrid = document.getElementById('skillsGrid');
        const allSkills = [
            ...artist.specializations.map(s => this.formatSpecializations([s])),
            ...artist.styles.map(s => s.charAt(0).toUpperCase() + s.slice(1))
        ];
        
        skillsGrid.innerHTML = allSkills.map(skill => 
            `<span class="skill-tag">${skill}</span>`
        ).join('');
    }

    // Render genres
    renderGenres(genres) {
        const genresList = document.getElementById('genresList');
        
        const genreNames = {
            'fantasy': 'Фантастика',
            'detective': 'Детективы',
            'children': 'Детская',
            'romance': 'Романы',
            'nonfiction': 'Нон-фикшн',
            'horror': 'Хоррор',
            'sci-fi': 'Научная фантастика'
        };
        
        genresList.innerHTML = genres.map(genre => 
            `<span class="genre-tag">${genreNames[genre] || genre}</span>`
        ).join('');
    }

    // Render contact information
    renderContactInfo(artist) {
        const contactInfo = document.getElementById('contactInfo');
        const items = [];
        
        if (artist.email) {
            items.push(`
                <div class="contact-item">
                    <i class="fas fa-envelope"></i>
                    <span>${artist.email}</span>
                </div>
            `);
        }
        
        if (artist.contact_phone) {
            items.push(`
                <div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <span>${artist.contact_phone}</span>
                </div>
            `);
        }
        
        if (artist.contact_telegram) {
            items.push(`
                <div class="contact-item">
                    <i class="fab fa-telegram"></i>
                    <span>${artist.contact_telegram}</span>
                </div>
            `);
        }
        
        if (artist.portfolio_url) {
            items.push(`
                <div class="contact-item">
                    <i class="fas fa-globe"></i>
                    <span><a href="${artist.portfolio_url}" target="_blank">Внешнее портфолио</a></span>
                </div>
            `);
        }
        
        contactInfo.innerHTML = items.join('');
    }

    // Load reviews
    async loadReviews() {
        try {
            const response = await fetch(`tables/reviews?search=reviewed_user_id:${this.currentArtistId}&limit=100`);
            if (response.ok) {
                const data = await response.json();
                this.reviews = data.data || [];
            } else {
                this.loadSampleReviews();
            }
        } catch (error) {
            this.loadSampleReviews();
        }
        
        this.renderReviews();
        this.renderRatingBreakdown();
    }

    // Load sample reviews for demo
    loadSampleReviews() {
        this.reviews = [
            {
                id: '1',
                reviewer_id: 'editor1',
                project_name: 'Обложка для "Магия снов"',
                rating: 5,
                work_quality: 5,
                communication: 5,
                deadlines: 5,
                review_text: 'Потрясающая работа! Анна сумела передать атмосферу книги с первого взгляда. Обложка получилась загадочной и притягательной, точно в стиле фэнтези. Работа была выполнена досрочно, а коммуникация была на высшем уровне.',
                would_work_again: true,
                created_at: '2024-01-15T10:00:00Z',
                reviewer_name: 'Елена Петрова'
            },
            {
                id: '2',
                reviewer_id: 'editor2',
                project_name: 'Серия обложек "Городские легенды"',
                rating: 4,
                work_quality: 4,
                communication: 5,
                deadlines: 4,
                review_text: 'Отличная работа по серии из 3 обложек. Анна создала единый стиль для всей серии, каждая обложка уникальна, но при этом они прекрасно дополняют друг друга. Небольшая задержка по срокам, но качество того стоило.',
                would_work_again: true,
                created_at: '2024-01-10T14:30:00Z',
                reviewer_name: 'Михаил Сорокин'
            },
            {
                id: '3',
                reviewer_id: 'editor3',
                project_name: 'Обложка детской книги',
                rating: 5,
                work_quality: 5,
                communication: 4,
                deadlines: 5,
                review_text: 'Яркая и красочная обложка для детской книги. Дети просто влюбились в персонажа с первого взгляда! Анна прекрасно понимает детскую психологию и умеет создавать привлекательные образы.',
                would_work_again: true,
                created_at: '2024-01-05T09:15:00Z',
                reviewer_name: 'Ольга Новикова'
            }
        ];
    }

    // Render reviews
    renderReviews() {
        const reviewsList = document.getElementById('reviewsList');
        
        if (this.reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>Пока нет отзывов</h3>
                    <p>Станьте первым, кто оставит отзыв об этом художнике</p>
                </div>
            `;
            return;
        }
        
        reviewsList.innerHTML = this.reviews.map(review => this.createReviewHTML(review)).join('');
    }

    // Create review HTML
    createReviewHTML(review) {
        const date = new Date(review.created_at).toLocaleDateString('ru-RU');
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-author">
                        <div class="review-avatar">
                            ${review.reviewer_name ? review.reviewer_name.charAt(0) : 'E'}
                        </div>
                        <div class="review-author-info">
                            <h4>${review.reviewer_name || 'Редактор Эксмо'}</h4>
                            <div class="review-project">${review.project_name}</div>
                        </div>
                    </div>
                    <div class="review-meta">
                        <div>${date}</div>
                    </div>
                </div>
                
                <div class="review-rating">
                    <span class="stars">${stars}</span>
                    <span>${review.rating}/5</span>
                </div>
                
                <div class="review-text">
                    ${review.review_text}
                </div>
                
                <div class="review-detailed">
                    <div class="review-category">
                        <div class="review-category-label">Качество</div>
                        <div class="review-category-value">${review.work_quality}/5</div>
                    </div>
                    <div class="review-category">
                        <div class="review-category-label">Общение</div>
                        <div class="review-category-value">${review.communication}/5</div>
                    </div>
                    <div class="review-category">
                        <div class="review-category-label">Сроки</div>
                        <div class="review-category-value">${review.deadlines}/5</div>
                    </div>
                </div>
                
                ${review.would_work_again ? 
                    '<div style="margin-top: 12px; color: #10b981; font-size: 14px;"><i class="fas fa-check"></i> Готов работать снова</div>' : 
                    ''
                }
            </div>
        `;
    }

    // Render rating breakdown
    renderRatingBreakdown() {
        if (this.reviews.length === 0) return;
        
        // Calculate overall rating
        const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / this.reviews.length;
        
        document.getElementById('overallRating').textContent = avgRating.toFixed(1);
        this.renderRating('overallStars', avgRating);
        document.getElementById('totalReviews').textContent = `${this.reviews.length} отзывов`;
        
        // Calculate rating distribution
        const distribution = [5, 4, 3, 2, 1].map(rating => ({
            rating,
            count: this.reviews.filter(r => r.rating === rating).length
        }));
        
        const maxCount = Math.max(...distribution.map(d => d.count));
        
        const breakdown = document.getElementById('ratingBreakdown');
        breakdown.innerHTML = distribution.map(({ rating, count }) => {
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return `
                <div class="rating-bar">
                    <span class="rating-bar-label">${rating} звезд</span>
                    <div class="rating-bar-fill">
                        <div class="rating-bar-progress" style="width: ${percentage}%"></div>
                    </div>
                    <span class="rating-bar-count">${count}</span>
                </div>
            `;
        }).join('');
    }

    // Load portfolio
    loadPortfolio() {
        // This would typically load from the artworks table
        this.loadSamplePortfolio();
    }

    // Load sample portfolio
    loadSamplePortfolio() {
        const portfolio = [
            {
                id: 1,
                title: 'Магия снов',
                type: 'cover',
                genre: 'fantasy',
                image: 'https://via.placeholder.com/280x200/e3f2fd/1976d2?text=Fantasy+Cover+1'
            },
            {
                id: 2,
                title: 'Городские легенды',
                type: 'cover',
                genre: 'fantasy',
                image: 'https://via.placeholder.com/280x200/f3e5f5/7b1fa2?text=Fantasy+Cover+2'
            },
            {
                id: 3,
                title: 'Детская сказка',
                type: 'illustration',
                genre: 'children',
                image: 'https://via.placeholder.com/280x200/fff3e0/ff8f00?text=Children+Book'
            },
            {
                id: 4,
                title: 'Логотип издательства',
                type: 'lettering',
                genre: 'nonfiction',
                image: 'https://via.placeholder.com/280x200/e8f5e8/2e7d32?text=Logo+Design'
            }
        ];
        
        this.renderPortfolio(portfolio);
    }

    // Render portfolio
    renderPortfolio(items) {
        const grid = document.getElementById('portfolioGrid');
        
        const filtered = this.portfolioFilter === 'all' ? 
            items : items.filter(item => item.type === this.portfolioFilter);
        
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <h3>Нет работ в этой категории</h3>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = filtered.map(item => `
            <div class="portfolio-item" onclick="openPortfolioItem(${item.id})">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
                <div class="portfolio-item-info">
                    <div class="portfolio-item-title">${item.title}</div>
                    <div class="portfolio-item-meta">${this.formatPortfolioType(item.type)} • ${this.formatGenre(item.genre)}</div>
                </div>
            </div>
        `).join('');
    }

    // Format portfolio type
    formatPortfolioType(type) {
        const types = {
            'cover': 'Обложка',
            'illustration': 'Иллюстрация',
            'lettering': 'Леттеринг',
            'layout': 'Макет'
        };
        return types[type] || type;
    }

    // Format genre
    formatGenre(genre) {
        const genres = {
            'fantasy': 'Фантастика',
            'children': 'Детская',
            'nonfiction': 'Нон-фикшн'
        };
        return genres[genre] || genre;
    }

    // Setup event listeners
    setupEventListeners() {
        // Review form submission
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitReview(reviewForm);
            });
        }
    }

    // Submit review
    async submitReview(form) {
        const formData = new FormData(form);
        
        const reviewData = {
            reviewer_id: currentUser?.id || 'anonymous',
            reviewed_user_id: this.currentArtistId,
            project_name: formData.get('project_name'),
            rating: parseInt(this.selectedRating),
            work_quality: parseInt(formData.get('work_quality')),
            communication: parseInt(formData.get('communication')),
            deadlines: parseInt(formData.get('deadlines')),
            review_text: formData.get('review_text'),
            would_work_again: formData.get('would_work_again') === 'on',
            is_verified: currentUser?.user_type === 'editor',
            is_visible: true,
            helpful_votes: 0
        };

        try {
            const response = await fetch('tables/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reviewData)
            });

            if (response.ok) {
                const newReview = await response.json();
                this.reviews.unshift({
                    ...newReview,
                    reviewer_name: currentUser?.full_name || 'Редактор Эксмо',
                    created_at: new Date().toISOString()
                });
                
                this.renderReviews();
                this.renderRatingBreakdown();
                closeModal('reviewModal');
                
                // Show success message
                modalManager.showNotification('Отзыв успешно добавлен!', 'success');
                
                // Reset form
                form.reset();
                this.selectedRating = 0;
                this.updateRatingStars();
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            modalManager.showNotification('Ошибка при добавлении отзыва', 'error');
        }
    }
}

// Tab switching
function switchProfileTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.profile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    profileManager.currentTab = tabName;
}

// Portfolio filtering
function filterPortfolio(filter) {
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    profileManager.portfolioFilter = filter;
    profileManager.loadPortfolio();
}

// Rating input for review modal
function setRating(rating) {
    profileManager.selectedRating = rating;
    profileManager.updateRatingStars();
    document.getElementById('selectedRating').value = rating;
}

// Update rating stars display
ProfileManager.prototype.updateRatingStars = function() {
    const stars = document.querySelectorAll('#ratingInput .rating-star');
    stars.forEach((star, index) => {
        if (index < this.selectedRating) {
            star.classList.add('active');
            star.textContent = '★';
        } else {
            star.classList.remove('active');
            star.textContent = '☆';
        }
    });
};

// Contact functions
function contactArtist() {
    if (!currentUser) {
        modalManager.showNotification('Войдите в систему для связи с художником', 'error');
        return;
    }
    
    if (currentUser.user_type !== 'editor') {
        modalManager.showNotification('Функция доступна только редакторам Эксмо', 'error');
        return;
    }
    
    // Update contact modal with artist info
    const artist = profileManager.currentArtist;
    document.getElementById('artistEmail').textContent = artist.email;
    
    if (artist.contact_phone) {
        document.getElementById('artistPhone').textContent = artist.contact_phone;
        document.getElementById('phoneContact').style.display = 'flex';
    }
    
    if (artist.contact_telegram) {
        document.getElementById('artistTelegram').textContent = artist.contact_telegram;
        document.getElementById('telegramContact').style.display = 'flex';
    }
    
    openModal('contactModal');
}

function addToFavorites() {
    if (!currentUser) {
        modalManager.showNotification('Войдите в систему для добавления в избранное', 'error');
        return;
    }
    
    // Toggle favorite status
    modalManager.showNotification('Добавлено в избранное!', 'success');
    
    const btn = document.getElementById('favoriteBtn');
    const icon = btn.querySelector('i');
    if (icon.classList.contains('far')) {
        icon.className = 'fas fa-heart';
        btn.style.color = '#ef4444';
    } else {
        icon.className = 'far fa-heart';
        btn.style.color = '';
    }
}

function shareProfile() {
    if (navigator.share) {
        navigator.share({
            title: `Профиль ${profileManager.currentArtist.full_name}`,
            text: `Посмотрите профиль талантливого художника`,
            url: window.location.href
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            modalManager.showNotification('Ссылка скопирована в буфер обмена', 'success');
        });
    }
}

function openReviewModal() {
    if (!currentUser) {
        modalManager.showNotification('Войдите в систему для написания отзыва', 'error');
        return;
    }
    
    openModal('reviewModal');
}

function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        modalManager.showNotification('Скопировано в буфер обмена', 'success');
    });
}

function openTelegram() {
    const telegram = profileManager.currentArtist.contact_telegram;
    if (telegram) {
        window.open(`https://t.me/${telegram.replace('@', '')}`, '_blank');
    }
}

function openPortfolioItem(itemId) {
    // This would open a lightbox or detailed view
    modalManager.showNotification('Функция просмотра в разработке', 'info');
}

function sortReviews(sortBy) {
    switch (sortBy) {
        case 'newest':
            profileManager.reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            profileManager.reviews.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'highest':
            profileManager.reviews.sort((a, b) => b.rating - a.rating);
            break;
        case 'lowest':
            profileManager.reviews.sort((a, b) => a.rating - b.rating);
            break;
    }
    
    profileManager.renderReviews();
}

// Initialize profile manager
const profileManager = new ProfileManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    profileManager.init();
    
    // Show write review button for logged in editors
    if (currentUser && currentUser.user_type === 'editor') {
        document.getElementById('writeReviewBtn').style.display = 'block';
    }
});

// Export for global use
window.profileManager = profileManager;