document.addEventListener('DOMContentLoaded', () => {
    // --- Default Credentials (for testing) ---
    const defaultUser = {
        email: "Abcxyz123@gmail.com",
        username: "Abcxyz123",
        password: "Abcxyz123"
    };

    // --- Element References ---
    const authForm = document.getElementById('auth-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginFormErrorDiv = document.getElementById('login-form-error');
    const authModalEl = document.getElementById('auth-modal-bootstrap');
    let authModalInstance;
    if (authModalEl) {
        authModalInstance = new bootstrap.Modal(authModalEl);
    }
    const switchToRegisterLinks = document.querySelectorAll('.switch-to-register');
    const switchToLoginLinks = document.querySelectorAll('.switch-to-login');
    const authButtonsContainer = document.querySelector('.auth-buttons');
    const userInfoContainer = document.querySelector('.user-info');
    const userDisplayNameSpan = document.getElementById('user-display-name');
    const cartIconCount = document.getElementById('cart-item-count');

    // --- User Management Functions ---
    const getUsers = () => {
        const usersJson = localStorage.getItem('registeredUsers');
        return usersJson ? JSON.parse(usersJson) : [defaultUser];
    };

    const saveUsers = (users) => {
        try {
            localStorage.setItem('registeredUsers', JSON.stringify(users));
        } catch (e) {
            console.error("Error saving users to localStorage:", e);
            alert("Không thể lưu thông tin tài khoản. Vui lòng kiểm tra lại.");
        }
    };

    const registerUser = (username, email, password) => {
        const users = getUsers();
        if (users.some(user => user.email === email || user.username === username)) {
            return { success: false, message: "Email hoặc tên người dùng đã tồn tại." };
        }
        users.push({ username, email, password });
        saveUsers(users);
        return { success: true, message: "Đăng ký thành công! Vui lòng đăng nhập." };
    };

    const validateUser = (identifier, password) => {
        const users = getUsers();
        const user = users.find(
            user => (user.email === identifier || user.username === identifier) && user.password === password
        );
        return user ? { success: true, user } : { success: false, message: "Tên đăng nhập/email hoặc mật khẩu không đúng!" };
    };

    // --- Utility Functions ---
    const formatCurrency = (number) => {
        if (isNaN(number)) return "0 VNĐ";
        try {
            return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        } catch (e) {
            console.error("Error formatting currency:", e);
            return `${number} VNĐ`;
        }
    };

    const parsePrice = (priceString) => {
        if (typeof priceString !== 'string') return 0;
        const cleanedString = priceString.replace(/ VNĐ/g, '').replace(/\./g, '').replace(/₫/g, '').trim();
        return parseFloat(cleanedString) || 0;
    };

    const renderProductDescription = (container, descriptionHtml, productId) => {
        if (!container) return;
        container.innerHTML = '';
        if (productId === 'piano1') {
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('description-content', 'collapsed');
            contentDiv.innerHTML = descriptionHtml;
            const toggleButton = document.createElement('button');
            toggleButton.classList.add('description-toggle');
            toggleButton.textContent = 'Xem chi tiết';
            toggleButton.dataset.action = 'expand';
            container.appendChild(contentDiv);
            container.appendChild(toggleButton);
            toggleButton.addEventListener('click', () => {
                const isCollapsed = contentDiv.classList.contains('collapsed');
                contentDiv.classList.toggle('collapsed', !isCollapsed);
                toggleButton.textContent = isCollapsed ? 'Thu gọn' : 'Xem chi tiết';
                toggleButton.dataset.action = isCollapsed ? 'collapse' : 'expand';
            });
        } else {
            container.innerHTML = descriptionHtml;
        }
    };

    // --- Cart Functions ---
    const getCart = () => {
        const cartJson = localStorage.getItem('shoppingCart');
        try {
            return cartJson ? JSON.parse(cartJson) : [];
        } catch (e) {
            console.error("Error parsing cart JSON from localStorage:", e);
            localStorage.removeItem('shoppingCart');
            return [];
        }
    };

    const saveCart = (cart) => {
        if (!Array.isArray(cart)) {
            console.error("Attempted to save non-array as cart:", cart);
            return;
        }
        try {
            localStorage.setItem('shoppingCart', JSON.stringify(cart));
            updateCartIcon();
        } catch (e) {
            console.error("Error saving cart to localStorage:", e);
        }
    };

    const addItemToCart = (productToAdd) => {
        if (!productToAdd || !productToAdd.id || !productToAdd.name || productToAdd.price == null || isNaN(productToAdd.price)) {
            console.error("Invalid product data for adding to cart:", productToAdd);
            alert("Lỗi: Không thể thêm sản phẩm không hợp lệ vào giỏ.");
            return;
        }
        const cart = getCart();
        const existingItemIndex = cart.findIndex(item => item.id === productToAdd.id);
        const quantityToAdd = Math.max(1, parseInt(productToAdd.quantity || 1, 10));
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 0) + quantityToAdd;
        } else {
            cart.push({
                id: productToAdd.id,
                name: productToAdd.name,
                price: productToAdd.price,
                quantity: quantityToAdd,
                image: productToAdd.image || 'https://via.placeholder.com/100x75/EEEEEE/FFFFFF?text=No+Image'
            });
        }
        saveCart(cart);
        console.log("Item added/updated in cart:", productToAdd.name, "Quantity:", quantityToAdd);
    };

    const updateItemQuantity = (productId, newQuantity) => {
        const cart = getCart();
        const itemIndex = cart.findIndex(item => item.id === productId);
        const quantity = parseInt(newQuantity, 10);
        if (itemIndex > -1 && !isNaN(quantity) && quantity >= 1) {
            cart[itemIndex].quantity = quantity;
            saveCart(cart);
            return true;
        } else if (itemIndex > -1 && !isNaN(quantity) && quantity <= 0) {
            return removeItemFromCart(productId);
        }
        console.warn(`Failed to update quantity for product ${productId} to ${newQuantity}`);
        return false;
    };

    const removeItemFromCart = (productId) => {
        let cart = getCart();
        const initialLength = cart.length;
        cart = cart.filter(item => item.id !== productId);
        if (cart.length < initialLength) {
            saveCart(cart);
            console.log(`Removed item ${productId} from cart.`);
            return true;
        }
        console.warn(`Item ${productId} not found in cart for removal.`);
        return false;
    };

    const getCartItemCount = () => {
        return getCart().reduce((total, item) => total + (item.quantity || 0), 0);
    };

    const getCartTotal = () => {
        return getCart().reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
    };

    const updateCartIcon = () => {
        if (cartIconCount) {
            const count = getCartItemCount();
            cartIconCount.textContent = count;
            cartIconCount.style.display = count === 0 ? 'none' : 'inline-block';
        }
    };

    const showAddToCartConfirmation = (buttonElement) => {
        if (!buttonElement) return;
        let confirmationSpan = buttonElement.parentNode.querySelector('.add-to-cart-confirmation');
        if (!confirmationSpan) {
            confirmationSpan = document.createElement('span');
            confirmationSpan.className = 'add-to-cart-confirmation';
            confirmationSpan.textContent = 'Đã thêm!';
            buttonElement.parentNode.insertBefore(confirmationSpan, buttonElement.nextSibling);
        }
        confirmationSpan.classList.remove('show');
        void confirmationSpan.offsetWidth;
        confirmationSpan.classList.add('show');
        if (confirmationSpan.hideTimeout) clearTimeout(confirmationSpan.hideTimeout);
        confirmationSpan.hideTimeout = setTimeout(() => {
            confirmationSpan.classList.remove('show');
        }, 2000);
    };

    // --- UI Update & Auth Logic ---
    const updateHeaderUI = () => {
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        if (authButtonsContainer && userInfoContainer && userDisplayNameSpan) {
            if (loggedInUser) {
                authButtonsContainer.classList.add('d-none');
                authButtonsContainer.classList.remove('d-flex');
                userInfoContainer.classList.remove('d-none');
                userInfoContainer.classList.add('d-flex', 'align-items-center');
                userDisplayNameSpan.textContent = `Xin chào, ${loggedInUser}!`;
                if (logoutBtn) {
                    logoutBtn.classList.remove('d-none');
                    logoutBtn.style.display = 'inline-block';
                }
            } else {
                authButtonsContainer.classList.remove('d-none');
                authButtonsContainer.classList.add('d-flex');
                userInfoContainer.classList.add('d-none');
                userInfoContainer.classList.remove('d-flex');
                userDisplayNameSpan.textContent = '';
                if (logoutBtn) {
                    logoutBtn.classList.add('d-none');
                    logoutBtn.style.display = 'none';
                }
            }
        } else {
            console.warn("One or more header UI elements are missing:", {
                authButtonsContainer,
                userInfoContainer,
                userDisplayNameSpan,
                logoutBtn
            });
        }
    };

    const handleLoginSuccess = (userIdentifier) => {
        sessionStorage.setItem('loggedInUser', userIdentifier);
        updateHeaderUI();
        if (authModalInstance) authModalInstance.hide();
        if (authForm) authForm.reset();
        clearFormErrors(authForm);
        if (loginFormErrorDiv) loginFormErrorDiv.style.display = 'none';
        console.log(`User ${userIdentifier} logged in successfully.`);
        window.location.reload();
    };

    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUser');
        updateHeaderUI();
        console.log("User logged out.");
        window.location.reload();
    };

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.warn("Logout button (#logout-btn) not found in the DOM.");
    }

    // --- Modal Handling ---
    const openModal = (tab) => {
        if (authModalInstance) {
            const tabButton = authModalEl.querySelector(`[data-tab="${tab}"]`);
            if (tabButton) tabButton.click();
            authModalInstance.show();
            clearFormErrors(authForm);
            if (loginFormErrorDiv) loginFormErrorDiv.style.display = 'none';
        }
    };

    if (loginBtn) loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('login');
    });

    if (registerBtn) registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('register');
    });

    switchToRegisterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const registerTab = authModalEl.querySelector('[data-tab="register"]');
            if (registerTab) registerTab.click();
        });
    });

    switchToLoginLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const loginTab = authModalEl.querySelector('[data-tab="login"]');
            if (loginTab) loginTab.click();
        });
    });

    // --- Welcome Modal ---
    let welcomeModalInstance;
    let showWelcomeTimeout;
    const welcomeModalEl = document.getElementById('welcome-notification-bootstrap');
    if (welcomeModalEl) {
        welcomeModalInstance = new bootstrap.Modal(welcomeModalEl);
        welcomeModalEl.addEventListener('hidden.bs.modal', () => {
            if (showWelcomeTimeout) clearTimeout(showWelcomeTimeout);
        });
        showWelcomeTimeout = setTimeout(() => {
            if (welcomeModalInstance) welcomeModalInstance.show();
        }, 3000);
    }

    // --- Form Validation & Submission ---
    const showError = (input, message) => {
        const formGroup = input.closest('.form-group');
        const errorDiv = formGroup ? formGroup.querySelector('.error-message') : null;
        if (errorDiv) errorDiv.textContent = message;
        input.classList.add('is-invalid');
    };

    const clearError = (input) => {
        const formGroup = input.closest('.form-group');
        const errorDiv = formGroup ? formGroup.querySelector('.error-message') : null;
        if (errorDiv) errorDiv.textContent = '';
        input.classList.remove('is-invalid');
    };

    const clearFormErrors = (form) => {
        if (!form) return;
        form.querySelectorAll('input.is-invalid').forEach(input => clearError(input));
        const generalError = form.querySelector('.form-error-message');
        if (generalError) {
            generalError.textContent = '';
            generalError.style.display = 'none';
        }
    };

    const validateRequired = (input) => {
        if (!input.value.trim()) {
            showError(input, 'Trường này là bắt buộc.');
            return false;
        }
        clearError(input);
        return true;
    };

    const validateEmailFormat = (input) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value.trim())) {
            showError(input, 'Vui lòng nhập địa chỉ email hợp lệ.');
            return false;
        }
        clearError(input);
        return true;
    };

    const validateMinLength = (input, minLength) => {
        if (input.value.trim().length < minLength) {
            showError(input, `Mật khẩu phải có ít nhất ${minLength} ký tự.`);
            return false;
        }
        clearError(input);
        return true;
    };

    const validatePasswordMatch = (password, confirmPassword) => {
        if (password.value.trim() !== confirmPassword.value.trim()) {
            showError(confirmPassword, 'Mật khẩu xác nhận không khớp.');
            return false;
        }
        clearError(confirmPassword);
        return true;
    };

    const validateNameCapitalization = (input) => {
        const name = input.value.trim();
        // Check if each word starts with an uppercase letter followed by lowercase letters
        const nameRegex = /^(?:[A-Z][a-z]*(?:\s[A-Z][a-z]*)*)$/;
        if (!nameRegex.test(name)) {
            showError(input, 'Họ tên phải viết hoa chữ cái đầu mỗi từ (VD: Nguyen Van Anh).');
            return false;
        }
        clearError(input);
        return true;
    };

    const validateForm = () => {
        if (!authForm || !authModalEl) return false;
        clearFormErrors(authForm);
        let isValid = true;
        const activeTab = authModalEl.querySelector('.tab-button.active')?.dataset.tab;

        if (activeTab === 'register') {
            const usernameInput = authForm.querySelector('#register-username, #register-username-detail');
            const emailInput = authForm.querySelector('#register-email, #register-email-detail');
            const passwordInput = authForm.querySelector('#register-password, #register-password-detail');
            const confirmPasswordInput = authForm.querySelector('#register-confirm-password, #register-confirm-password-detail');

            if (!validateRequired(usernameInput) || !validateNameCapitalization(usernameInput)) isValid = false;
            if (!validateRequired(emailInput) || !validateEmailFormat(emailInput)) isValid = false;
            if (!validateRequired(passwordInput) || !validateMinLength(passwordInput, 6)) isValid = false;
            if (!validateRequired(confirmPasswordInput) || !validatePasswordMatch(passwordInput, confirmPasswordInput)) isValid = false;
        } else if (activeTab === 'login') {
            const usernameInput = authForm.querySelector('#login-username, #login-username-detail');
            const passwordInput = authForm.querySelector('#login-password, #login-password-detail');

            if (!validateRequired(usernameInput)) isValid = false;
            if (!validateRequired(passwordInput)) isValid = false;
        }
        return isValid;
    };

    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (loginFormErrorDiv) loginFormErrorDiv.style.display = 'none';
            if (!validateForm()) return;

            const activeTab = authModalEl.querySelector('.tab-button.active')?.dataset.tab;
            if (activeTab === 'login') {
                const usernameInput = authForm.querySelector('#login-username, #login-username-detail');
                const passwordInput = authForm.querySelector('#login-password, #login-password-detail');
                const identifier = usernameInput.value.trim();
                const password = passwordInput.value.trim();

                const loginResult = validateUser(identifier, password);
                if (loginResult.success) {
                    handleLoginSuccess(identifier);
                } else {
                    if (loginFormErrorDiv) {
                        loginFormErrorDiv.textContent = loginResult.message;
                        loginFormErrorDiv.style.display = 'block';
                    }
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } else if (activeTab === 'register') {
                const usernameInput = authForm.querySelector('#register-username, #register-username-detail');
                const emailInput = authForm.querySelector('#register-email, #register-email-detail');
                const passwordInput = authForm.querySelector('#register-password, #register-password-detail');

                const username = usernameInput.value.trim();
                const email = emailInput.value.trim();
                const password = passwordInput.value.trim();

                const registerResult = registerUser(username, email, password);
                if (registerResult.success) {
                    alert(registerResult.message);
                    const loginTab = authModalEl.querySelector('[data-tab="login"]');
                    if (loginTab) loginTab.click();
                    authForm.reset();
                    clearFormErrors(authForm);
                } else {
                    if (loginFormErrorDiv) {
                        loginFormErrorDiv.textContent = registerResult.message;
                        loginFormErrorDiv.style.display = 'block';
                    }
                }
            }
        });
    }

    // --- Product Data ---
    const allProductData = {
        guitar1: { name: "Guitar Acoustic ABC", price: 5500000, image: "../img/gt1.jpg", category: "guitar", imageGallery: ["../img/gt1.jpg", "../img/gt2.jpg", "../img/gt3.jpg"], description: "<p>Mô tả chi tiết cho Guitar Acoustic ABC... làm từ gỗ thông, âm thanh vang sáng.</p>" },
        guitar2: { name: "Đàn Guitar Điện Donner DST-550, Black", price: 8200000, image: "../img/gtd1.jpg", category: "guitar", imageGallery: ["../img/gtd1.jpg", "../img/gtd2.jpg", "../img/gtd3.jpg"], description: "<p>Mô tả chi tiết cho Guitar Điện XYZ... pickup humbucker, phù hợp rock.</p>" },
        guitar_donner_dst550: { name: "Đàn Guitar Classic Cordoba C1M 1/4", price: 5200000, image: "../img/gtl1.jpg", category: "guitar", imageGallery: ["../img/gtl1.jpg", "../img/gtl2.jpg", "../img/gtl3.jpg", "../img/gtl4.jpg"], description: "<p>Guitar Classic Cordoba C1M 1/4...</p>" },
        piano1: { name: "Piano Đứng Yamaha U1", price: 85000000, image: "../img/yamaha1.jpg", category: "piano", imageGallery: ["../img/yamaha1.jpg", "../img/yamaha2.jpg", "../img/yamaha3.jpg"], description: "<p><strong>Đàn Piano Yamaha U1</strong>...</p>" },
        piano2: { name: "Piano Điện Casio PX-S1100", price: 18900000, image: "../img/pn1.jpg", category: "piano", imageGallery: ["../img/pn1.jpg", "../img/pn2.jpg", "../img/pn3.jpg", "../img/pn4.jpg"], description: "<p>Mô tả chi tiết cho Piano Điện Casio PX-S1100...</p>" },
        piano3: { name: "Grand Piano Kawai GL-10", price: 350000000, image: "../img/pn5.jpg", category: "piano", imageGallery: ["../img/pn5.jpg", "../img/pn6.jpg", "../img/pn7.jpg", "../img/pn8.jpg"], description: "<p>Mô tả chi tiết cho Grand Piano Kawai GL-10...</p>" },
        drum1: { name: "Bộ Trống Jazz Pearl Roadshow", price: 15600000, image: "../img/dr1.jpg", category: "drums", imageGallery: ["../img/dr1.jpg", "../img/dr2.jpg", "../img/dr3.jpg", "../img/dr4.jpg"], description: "<p>Mô tả chi tiết cho Bộ Trống Jazz Pearl Roadshow...</p>" },
        drum2: { name: "Bộ Trống Điện Roland TD-1DMK", price: 22500000, image: "../img/dr5.jpg", category: "drums", imageGallery: ["../img/dr5.jpg", "../img/dr6.jpg", "../img/dr7.jpg", "../img/dr8.jpg"], description: "<p>Mô tả chi tiết cho Trống Điện Roland TD-1DMK...</p>" },
        drum3: { name: "Trống Cajon Meinl", price: 3100000, image: "../img/dr10.jpg", category: "drums", imageGallery: ["../img/dr10.jpg"], description: "<p>Mô tả chi tiết cho Trống Cajon Meinl...</p>" },
        violin1: { name: "Violin Acoustic Size 4/4", price: 4200000, image: "../img/vi1.jpg", category: "violin", imageGallery: ["../img/vi1.jpg", "../img/vi2.jpg", "../img/vi3.jpg", "../img/vi4.jpg"], description: "<p>Mô tả chi tiết cho Violin Acoustic Size 4/4...</p>" },
        violin2: { name: "Violin Điện Yamaha YEV104", price: 19800000, image: "../img/vi11.jpg", category: "violin", imageGallery: ["../img/vi11.jpg"], description: "<p>Mô tả chi tiết cho Violin Điện Yamaha YEV104...</p>" },
        violin3: { name: "Violin Size 1/2 Cho Bé", price: 2900000, image: "../img/vi21.jpg", category: "violin", imageGallery: ["../img/vi21.jpg"], description: "<p>Mô tả chi tiết cho Violin Size 1/2 Cho Bé...</p>" }
    };

    // --- Product Detail Page Logic ---
    if (window.location.pathname.includes('product-detail.html')) {
        const addToCartButton = document.querySelector('.add-to-cart-btn');
        const mainProductImageEl = document.getElementById('main-product-image');
        const productNameEl = document.getElementById('product-name');
        const productPriceEl = document.getElementById('product-price');
        const productDescContainerEl = document.getElementById('product-description');
        const thumbnailContainer = document.querySelector('.thumbnail-images');
        const urlParamsDetail = new URLSearchParams(window.location.search);
        const productIdDetail = urlParamsDetail.get('id');
        const product = allProductData[productIdDetail];
        const detailContainer = document.querySelector('.product-detail-container');

        if (product && detailContainer && mainProductImageEl && thumbnailContainer) {
            const pageTitle = document.querySelector('title');
            if (productNameEl) productNameEl.textContent = product.name;
            if (productPriceEl && !isNaN(product.price)) {
                productPriceEl.textContent = formatCurrency(product.price);
            } else if (productPriceEl) {
                productPriceEl.textContent = "Liên hệ";
            }
            if (pageTitle) pageTitle.textContent = `${product.name} - Nhạc Cụ Store`;

            thumbnailContainer.innerHTML = '';
            if (product.imageGallery && product.imageGallery.length > 0) {
                mainProductImageEl.src = product.imageGallery[0];
                mainProductImageEl.alt = product.name;
                product.imageGallery.forEach((imgUrl, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = imgUrl;
                    thumb.alt = `${product.name} - Ảnh chi tiết ${index + 1}`;
                    thumb.classList.add('thumbnail');
                    if (index === 0) thumb.classList.add('active');
                    thumb.addEventListener('click', () => {
                        mainProductImageEl.src = imgUrl;
                        mainProductImageEl.alt = thumb.alt;
                        thumbnailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                    });
                    thumbnailContainer.appendChild(thumb);
                });
            } else {
                mainProductImageEl.src = 'https://via.placeholder.com/600x400/EEEEEE/FFFFFF?text=No+Image+Available';
                mainProductImageEl.alt = product.name;
                thumbnailContainer.innerHTML = '<p style="font-size: 0.8em; color: #666;">Không có ảnh chi tiết.</p>';
            }

            if (productDescContainerEl) {
                renderProductDescription(productDescContainerEl, product.description || "<p>Không có mô tả.</p>", productIdDetail);
            }

            if (addToCartButton && !isNaN(product.price)) {
                addToCartButton.addEventListener('click', () => {
                    const productToAdd = {
                        id: productIdDetail,
                        name: product.name,
                        price: product.price,
                        image: product.imageGallery && product.imageGallery.length > 0 ? product.imageGallery[0] : 'https://via.placeholder.com/100x75',
                        quantity: 1
                    };
                    addItemToCart(productToAdd);
                    showAddToCartConfirmation(addToCartButton);
                });
            } else if (addToCartButton) {
                addToCartButton.disabled = true;
                addToCartButton.textContent = "Hết hàng/Liên hệ";
            }
        } else if (detailContainer) {
            detailContainer.innerHTML = '<p>Sản phẩm không tồn tại hoặc đã bị xóa.</p>';
            if (!mainProductImageEl) console.error("Không tìm thấy phần tử #main-product-image");
            if (!thumbnailContainer) console.error("Không tìm thấy phần tử .thumbnail-images");
        }
    }

    // --- Cart Page Logic ---
    if (window.location.pathname.includes('cart.html')) {
        const cartContainer = document.getElementById('cart-container');
        const cartItemsList = cartContainer?.querySelector('.cart-items-list');
        const cartSummary = cartContainer?.querySelector('.cart-summary');
        const cartEmptyMessage = cartContainer?.querySelector('.cart-empty-message');
        const cartTotalPriceEl = document.getElementById('cart-total-price');
        const checkoutBtn = document.getElementById('checkout-btn');

        const renderCartItems = () => {
            if (!cartItemsList || !cartSummary || !cartEmptyMessage || !cartTotalPriceEl) return;
            const cart = getCart();
            cartItemsList.innerHTML = '';
            if (cart.length === 0) {
                cartEmptyMessage.classList.remove('hidden');
                cartItemsList.classList.add('hidden');
                cartSummary.classList.add('hidden');
            } else {
                cartEmptyMessage.classList.add('hidden');
                cartItemsList.classList.remove('hidden');
                cartSummary.classList.remove('hidden');
                cart.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('cart-item');
                    itemElement.dataset.id = item.id;
                    const price = item.price || 0;
                    const quantity = item.quantity || 1;
                    const subtotal = price * quantity;
                    itemElement.innerHTML = `
                        <img src="${item.image || 'https://via.placeholder.com/100x75'}" alt="${item.name || 'Sản phẩm'}" class="cart-item-image">
                        <div class="cart-item-details">
                            <h3 class="cart-item-name">${item.name || 'N/A'}</h3>
                            <p class="cart-item-price">${formatCurrency(price)}</p>
                        </div>
                        <div class="cart-item-quantity">
                            <label for="qty-${item.id}" class="sr-only">Số lượng ${item.name || ''}:</label>
                            <input type="number" id="qty-${item.id}" class="quantity-input" value="${quantity}" min="1" max="99">
                        </div>
                        <p class="cart-item-subtotal">${formatCurrency(subtotal)}</p>
                        <button class="remove-item-btn" aria-label="Xóa ${item.name || 'sản phẩm'}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    `;
                    cartItemsList.appendChild(itemElement);
                });
                cartTotalPriceEl.textContent = formatCurrency(getCartTotal());
                addCartEventListeners();
            }
        };

        const addCartEventListeners = () => {
            const quantityInputs = cartItemsList?.querySelectorAll('.quantity-input');
            const removeButtons = cartItemsList?.querySelectorAll('.remove-item-btn');
            quantityInputs?.forEach(input => {
                input.addEventListener('change', (event) => {
                    const inputElement = event.target;
                    const cartItemElement = inputElement.closest('.cart-item');
                    if (!cartItemElement) return;
                    const productId = cartItemElement.dataset.id;
                    const newQuantity = parseInt(inputElement.value, 10);
                    if (isNaN(newQuantity) || newQuantity < 1) {
                        if (confirm(`Số lượng không hợp lệ. Bạn có muốn xóa "${cartItemElement.querySelector('.cart-item-name')?.textContent}" khỏi giỏ hàng?`)) {
                            if (removeItemFromCart(productId)) renderCartItems();
                        } else {
                            const currentCart = getCart();
                            const item = currentCart.find(i => i.id === productId);
                            inputElement.value = item ? item.quantity : 1;
                        }
                    } else {
                        if (updateItemQuantity(productId, newQuantity)) {
                            const updatedCart = getCart();
                            const item = updatedCart.find(i => i.id === productId);
                            const subtotalEl = cartItemElement.querySelector('.cart-item-subtotal');
                            if (subtotalEl && item) {
                                subtotalEl.textContent = formatCurrency((item.price || 0) * (item.quantity || 0));
                            }
                            if (cartTotalPriceEl) cartTotalPriceEl.textContent = formatCurrency(getCartTotal());
                        }
                    }
                });
            });
            removeButtons?.forEach(button => {
                button.addEventListener('click', (event) => {
                    const buttonElement = event.currentTarget;
                    const cartItemElement = buttonElement.closest('.cart-item');
                    if (!cartItemElement) return;
                    const productId = cartItemElement.dataset.id;
                    const productName = cartItemElement.querySelector('.cart-item-name')?.textContent || 'sản phẩm này';
                    if (confirm(`Bạn có chắc chắn muốn xóa "${productName}" khỏi giỏ hàng?`)) {
                        if (removeItemFromCart(productId)) renderCartItems();
                    }
                });
            });
        };

        renderCartItems();
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (getCartItemCount() > 0) {
                    alert("Chức năng thanh toán chưa được cài đặt! Giỏ hàng sẽ được xóa (mô phỏng).");
                    saveCart([]);
                    renderCartItems();
                } else {
                    alert("Giỏ hàng đang trống.");
                }
            });
        }
    }

    // --- Product Search Functionality ---
    const productSearchForm = document.getElementById('product-search-form');
    const searchInputHeader = document.getElementById('search-input-header');
    const searchSuggestionsHeaderDiv = document.getElementById('search-suggestions-header');
    const searchResultsContainer = document.getElementById('search-results-container');
    const searchResultsGrid = document.getElementById('search-results-grid');
    const originalProductSections = document.getElementById('original-product-sections');

    const displaySearchResults = (results) => {
        if (!searchResultsGrid || !searchResultsContainer || !originalProductSections) return;
        searchResultsGrid.innerHTML = '';
        if (results.length === 0) {
            searchResultsGrid.innerHTML = '<p>Không tìm thấy sản phẩm nào.</p>';
            searchResultsContainer.style.display = 'block';
            originalProductSections.style.display = 'none';
            return;
        }
        results.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('col');
            productCard.innerHTML = `
                <div class="card h-100 product-card">
                    <a href="product-detail.html?id=${product.id}" class="text-decoration-none text-dark">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text price">${formatCurrency(product.price)}</p>
                        </div>
                    </a>
                </div>
            `;
            searchResultsGrid.appendChild(productCard);
        });
        searchResultsContainer.style.display = 'block';
        originalProductSections.style.display = 'none';
    };

    const performSearch = (query) => {
        if (query.trim() === "") {
            if (originalProductSections) originalProductSections.style.display = 'block';
            if (searchResultsContainer) searchResultsContainer.style.display = 'none';
            if (searchResultsGrid) searchResultsGrid.innerHTML = '';
            return;
        }
        const searchResults = [];
        for (const id in allProductData) {
            if (allProductData[id].name.toLowerCase().includes(query.toLowerCase())) {
                searchResults.push({ id, ...allProductData[id] });
            }
        }
        displaySearchResults(searchResults);
    };

    const showSearchSuggestions = (query) => {
        if (!searchInputHeader || !searchSuggestionsHeaderDiv) return;
        const lowerCaseQuery = query.toLowerCase().trim();
        searchSuggestionsHeaderDiv.innerHTML = '';
        if (lowerCaseQuery.length < 1) {
            searchSuggestionsHeaderDiv.classList.remove('show');
            return;
        }
        const matchedProducts = [];
        for (const id in allProductData) {
            if (allProductData[id].name.toLowerCase().includes(lowerCaseQuery)) {
                matchedProducts.push({ id, ...allProductData[id] });
            }
        }
        if (matchedProducts.length > 0) {
            matchedProducts.slice(0, 5).forEach(product => {
                const suggestionItem = document.createElement('button');
                suggestionItem.type = 'button';
                suggestionItem.classList.add('dropdown-item');
                suggestionItem.textContent = product.name;
                suggestionItem.addEventListener('click', () => {
                    window.location.href = `product-detail.html?id=${product.id}`;
                });
                searchSuggestionsHeaderDiv.appendChild(suggestionItem);
            });
            searchSuggestionsHeaderDiv.classList.add('show');
        } else {
            searchSuggestionsHeaderDiv.classList.remove('show');
        }
    };

    if (searchInputHeader) {
        searchInputHeader.addEventListener('input', () => {
            showSearchSuggestions(searchInputHeader.value);
        });
        document.addEventListener('click', (event) => {
            if (searchSuggestionsHeaderDiv && !searchInputHeader.contains(event.target) && !searchSuggestionsHeaderDiv.contains(event.target)) {
                searchSuggestionsHeaderDiv.classList.remove('show');
            }
        });
        searchInputHeader.addEventListener('focus', () => {
            if (searchInputHeader.value.trim().length > 0) {
                showSearchSuggestions(searchInputHeader.value);
            }
        });
    }

    if (productSearchForm) {
        productSearchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const query = searchInputHeader.value;
            if (searchSuggestionsHeaderDiv) {
                searchSuggestionsHeaderDiv.classList.remove('show');
                searchSuggestionsHeaderDiv.innerHTML = '';
            }
            performSearch(query);
        });
    }

    // --- Initial Setup ---
    updateHeaderUI();
    updateCartIcon();

    window.addEventListener('load', () => {
        const modalOpen = authModalEl?.classList.contains('show');
        const welcomeOpen = welcomeModalEl?.classList.contains('show');
        if (!modalOpen && !welcomeOpen) {
            document.body.classList.remove('scroll-lock');
        }
    });
});
