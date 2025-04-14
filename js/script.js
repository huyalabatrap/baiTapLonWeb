document.addEventListener('DOMContentLoaded', () => {
    // --- Default Credentials ---
    const defaultUser = {
        email: "Abcxyz123@gmail.com",
        password: "Abcxyz123"
    };

    // --- Element References ---
    // Ensure elements are selected after DOM is loaded
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const nav = document.querySelector('header nav');
    const modal = document.getElementById('auth-modal');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const closeModalBtn = modal ? modal.querySelector('.close-button') : null;
    const authTabs = modal ? modal.querySelectorAll('.tab-button') : [];
    const formContents = modal ? modal.querySelectorAll('.form-content') : [];
    const authForm = document.getElementById('auth-form');
    const switchToRegisterLinks = modal ? modal.querySelectorAll('.switch-to-register') : [];
    const switchToLoginLinks = modal ? modal.querySelectorAll('.switch-to-login') : [];
    const welcomeModal = document.getElementById('welcome-notification');
    const welcomeCloseBtn = welcomeModal ? welcomeModal.querySelector('.welcome-close-button') : null;
    const cartIconCount = document.getElementById('cart-item-count');

    // Header Auth Area Elements
    const authButtonsContainer = document.querySelector('.auth-buttons');
    const userInfoContainer = document.querySelector('.user-info');
    const userDisplayNameSpan = document.getElementById('user-display-name');
    const logoutBtn = document.getElementById('logout-btn');

    // Login form error message display
    const loginFormErrorDiv = document.getElementById('login-form-error');


    // --- Utility Functions ---
    const formatCurrency = (number) => {
        if (isNaN(number)) return "0 VNĐ";
        try {
            // Use 'vi-VN' for Vietnamese Dong formatting
             return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        } catch (e) {
            console.error("Error formatting currency:", e);
            return `${number} VNĐ`; // Fallback
        }
    };

    const parsePrice = (priceString) => {
        if (typeof priceString !== 'string') return 0;
        // Remove currency symbols, dots (thousands separators), and use comma as decimal if needed (though VND usually doesn't use decimals)
        const cleanedString = priceString.replace(/ VNĐ/g, '').replace(/\./g, '').replace(/₫/g, '').trim();
        return parseFloat(cleanedString) || 0;
    };

    // --- Function to render product description (with expand/collapse for specific IDs) ---
    // *** MOVED FUNCTION DEFINITION HERE - START ***
    const renderProductDescription = (container, descriptionHtml, productId) => {
        if (!container) return;
        container.innerHTML = ''; // Clear existing content

        // Apply expand/collapse ONLY for piano1
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
                if (isCollapsed) {
                    contentDiv.classList.remove('collapsed');
                    toggleButton.textContent = 'Thu gọn';
                    toggleButton.dataset.action = 'collapse';
                } else {
                    contentDiv.classList.add('collapsed');
                    toggleButton.textContent = 'Xem chi tiết';
                    toggleButton.dataset.action = 'expand';
                }
            });
        } else {
            // For other products, just display the description directly
            container.innerHTML = descriptionHtml;
        }
    };
    // *** MOVED FUNCTION DEFINITION HERE - END ***


    // --- Cart Functions ---
    const getCart = () => {
        const cartJson = localStorage.getItem('shoppingCart');
        try {
            return cartJson ? JSON.parse(cartJson) : [];
        } catch (e) {
            console.error("Error parsing cart JSON from localStorage:", e);
            localStorage.removeItem('shoppingCart'); // Clear corrupted data
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
            updateCartIcon(); // Update icon whenever cart is saved
        } catch (e) {
            console.error("Error saving cart to localStorage:", e);
            // Consider a more user-friendly error message if needed
            // alert("Không thể lưu giỏ hàng. LocalStorage có thể bị đầy hoặc bị tắt.");
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
        const quantityToAdd = Math.max(1, parseInt(productToAdd.quantity || 1, 10)); // Ensure quantity is at least 1 and an integer

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 0) + quantityToAdd; // Ensure existing quantity is a number
        } else {
            cart.push({
                id: productToAdd.id,
                name: productToAdd.name,
                price: productToAdd.price, // Should be a number
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
            return removeItemFromCart(productId); // Delegate removal
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


    // --- Update Cart Icon Function ---
    const updateCartIcon = () => {
        const cartIconCountElement = document.getElementById('cart-item-count');
        if (cartIconCountElement) {
            const count = getCartItemCount();
            cartIconCountElement.textContent = count;
            cartIconCountElement.classList.toggle('hidden', count === 0);
        }
    };


    // --- Add to Cart Confirmation Message ---
    const showAddToCartConfirmation = (buttonElement) => {
         if (!buttonElement) return;
         let confirmationSpan = buttonElement.parentNode.querySelector('.add-to-cart-confirmation');

         if (!confirmationSpan) {
             confirmationSpan = document.createElement('span');
             confirmationSpan.className = 'add-to-cart-confirmation';
             confirmationSpan.textContent = 'Đã thêm!';
             buttonElement.parentNode.insertBefore(confirmationSpan, buttonElement.nextSibling);
         }
         confirmationSpan.classList.remove('show'); // Reset animation
         void confirmationSpan.offsetWidth; // Trigger reflow
         confirmationSpan.classList.add('show');

         if (confirmationSpan.hideTimeout) clearTimeout(confirmationSpan.hideTimeout);
         confirmationSpan.hideTimeout = setTimeout(() => {
             confirmationSpan.classList.remove('show');
         }, 2000);
    };


    // --- Function to Update Header UI based on Login State ---
    const updateHeaderUI = () => {
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        const authButtons = document.querySelector('.auth-buttons');
        const userInfo = document.querySelector('.user-info');
        const userNameSpan = document.getElementById('user-display-name');

        if (authButtons && userInfo && userNameSpan) {
             if (loggedInUser) {
                 authButtons.classList.add('hidden');
                 userInfo.classList.remove('hidden');
                 userNameSpan.textContent = loggedInUser;
             } else {
                 authButtons.classList.remove('hidden');
                 userInfo.classList.add('hidden');
                 userNameSpan.textContent = '';
             }
        }
    };

    // --- Function to Handle Successful Login ---
    const handleLoginSuccess = (userIdentifier) => {
        sessionStorage.setItem('loggedInUser', userIdentifier);
        updateHeaderUI();
        closeModal(); // Close the auth modal
        if (authForm) authForm.reset();
        clearFormErrors(authForm);
        if(loginFormErrorDiv) loginFormErrorDiv.style.display = 'none';
        console.log(`User ${userIdentifier} logged in successfully.`);
    };

     // --- Function to Handle Logout ---
    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUser');
        updateHeaderUI();
        console.log("User logged out.");
    };

    // --- Add Logout Event Listener ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }


    // --- Mobile Menu Toggle ---
    if (menuToggle && nav) {
         menuToggle.addEventListener('click', () => {
             nav.classList.toggle('active');
             menuToggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
         });
         document.addEventListener('click', (event) => {
             if (nav && !nav.contains(event.target) && !menuToggle.contains(event.target) && nav.classList.contains('active')) {
                 nav.classList.remove('active');
                 menuToggle.textContent = '☰';
              }
         });
    }


    // --- Modal Opening/Closing and Scroll Lock Logic ---

    // Function to open the Auth modal
    const openModal = (initialTab) => {
        if (!modal) return;
        modal.style.display = 'flex';
        document.body.classList.add('scroll-lock'); // Lock scroll when opening Auth modal
        switchTab(initialTab); // Set the correct tab
        clearFormErrors(authForm); // Clear previous errors
        if(loginFormErrorDiv) loginFormErrorDiv.style.display = 'none'; // Hide general login error
    };

    // Function to close the Auth modal
    const closeModal = () => {
        if (!modal || modal.style.display === 'none') return;
        modal.style.display = 'none';
        // Restore scroll ONLY if the Welcome modal is ALSO closed
        const welcomeModalCheck = document.getElementById('welcome-notification');
        if (!welcomeModalCheck || welcomeModalCheck.style.display === 'none' || welcomeModalCheck.style.display === '') {
             document.body.classList.remove('scroll-lock'); // Restore scroll
        }
    };

    // Function to close the Welcome modal
    const closeWelcomeModal = () => {
        if (welcomeModal) {
            welcomeModal.style.display = 'none';
            // Restore scroll ONLY if the Auth modal is ALSO closed
            const authModalCheck = document.getElementById('auth-modal');
            if (!authModalCheck || authModalCheck.style.display === 'none' || authModalCheck.style.display === '') {
                document.body.classList.remove('scroll-lock'); // Restore scroll
            }
        }
    };

    // Function to switch tabs within the Auth modal
    const switchTab = (tabName) => {
        if (!modal) return;
        authTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        formContents.forEach(content => {
            content.classList.toggle('hidden', content.id !== `${tabName}-content`);
        });
        clearFormErrors(authForm); // Reset errors when switching tabs
        if(loginFormErrorDiv) loginFormErrorDiv.style.display = 'none'; // Hide general login error
    };

    // --- Event Listeners for Modals ---

    // Auth Modal Triggers
    if (loginBtn) {
        loginBtn.addEventListener('click', () => openModal('login'));
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', () => openModal('register'));
    }

    // Auth Modal Closing (X button and background click)
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) { // Click on background/overlay
                closeModal();
            }
        });
        // Tab Switching Links
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
        switchToRegisterLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab('register');
            });
        });
         switchToLoginLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab('login');
            });
        });
    }

    // Welcome Modal Trigger (Timeout) and Closing
    if (welcomeModal && welcomeCloseBtn) {
        const showWelcomeTimeout = setTimeout(() => {
            if(welcomeModal) { // Check again if modal exists
                welcomeModal.style.display = 'flex';
                document.body.classList.add('scroll-lock'); // Lock scroll when opening Welcome modal
            }
        }, 3000);

        welcomeCloseBtn.addEventListener('click', () => {
            closeWelcomeModal();
            clearTimeout(showWelcomeTimeout); // Clear timeout if closed early
        });
        welcomeModal.addEventListener('click', (event) => {
            if (event.target === welcomeModal) { // Click on background/overlay
                closeWelcomeModal();
                 clearTimeout(showWelcomeTimeout);
            }
        });
    }


    // --- Form Validation & Submission ---
    if (authForm) {
        authForm.addEventListener('submit', (event) => {
            event.preventDefault();
             if(loginFormErrorDiv) loginFormErrorDiv.style.display = 'none';

            if (validateForm()) { // validateForm handles field-specific errors
                const activeTab = modal.querySelector('.tab-button.active')?.dataset.tab;

                if (activeTab === 'login') {
                    const usernameOrEmailInput = authForm.querySelector('#login-content #login-username');
                    const passwordInput = authForm.querySelector('#login-content #login-password');
                    const enteredIdentifier = usernameOrEmailInput?.value.trim();
                    const enteredPassword = passwordInput?.value.trim();

                    if (!enteredIdentifier || !enteredPassword) return; // Basic check

                    // --- Login Logic ---
                    if (enteredIdentifier === defaultUser.email && enteredPassword === defaultUser.password) {
                         handleLoginSuccess(enteredIdentifier);
                    } else {
                        console.log('Invalid login credentials.');
                        if(loginFormErrorDiv) {
                            loginFormErrorDiv.textContent = 'Email hoặc mật khẩu không chính xác.';
                             loginFormErrorDiv.style.display = 'block';
                        }
                        if (passwordInput) { passwordInput.value = ''; passwordInput.focus(); }
                    }
                } else if (activeTab === 'register') {
                    // --- Registration Logic (Simulation) ---
                    console.log('Registration form is valid. Simulating registration...');
                    alert('Đăng ký thành công! (Đây là bản demo - bạn có thể đăng nhập bằng tài khoản mặc định)');
                    switchTab('login');
                    if (authForm) authForm.reset();
                    clearFormErrors(authForm);
                }
            } else {
                console.log('Form validation failed.');
                // Field-specific errors already shown by validateForm
            }
        });
    }

    // --- Validation Helper Functions ---
    const showError = (inputElement, message) => {
        if (!inputElement) return;
        const formGroup = inputElement.closest('.form-group');
        const errorElement = formGroup?.querySelector('.error-message');
        if (errorElement) errorElement.textContent = message;
        inputElement.classList.add('error');
    };

    const clearError = (inputElement) => {
         if (!inputElement) return;
         const formGroup = inputElement.closest('.form-group');
         const errorElement = formGroup?.querySelector('.error-message');
         if (errorElement) errorElement.textContent = '';
         inputElement.classList.remove('error');
    };

    const clearFormErrors = (form) => {
        if (!form) return;
        form.querySelectorAll('input.error').forEach(input => clearError(input));
        // Clear general form error
        const generalError = form.querySelector('.form-error-message');
        if (generalError) {
            generalError.textContent = '';
            generalError.style.display = 'none';
        }
    };

    const validateRequired = (inputElement) => {
        if (!inputElement) return false;
        if (inputElement.value.trim() === '') {
            showError(inputElement, 'Trường này là bắt buộc.');
            return false;
        }
        clearError(inputElement);
        return true;
    };

    const validateEmailFormat = (emailElement) => {
        if (!emailElement) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailElement.value.trim())) {
            showError(emailElement, 'Vui lòng nhập địa chỉ email hợp lệ.');
            return false;
        }
        clearError(emailElement);
        return true;
    };

     const validateMinLength = (inputElement, minLength) => {
        if (!inputElement) return false;
        if (inputElement.value.trim().length < minLength) {
            showError(inputElement, `Mật khẩu phải có ít nhất ${minLength} ký tự.`);
            return false;
        }
        clearError(inputElement);
        return true;
    };

    const validatePasswordMatch = (passwordElement, confirmPasswordElement) => {
        if (!passwordElement || !confirmPasswordElement) return false;
        if (passwordElement.value.trim() !== confirmPasswordElement.value.trim()) {
            showError(confirmPasswordElement, 'Mật khẩu xác nhận không khớp.');
            return false;
        }
        clearError(confirmPasswordElement);
        return true;
    };

    // --- Main Form Validation Function ---
    const validateForm = () => {
        if (!authForm || !modal) return false;
        clearFormErrors(authForm);
        let isValid = true;
        const activeTab = modal.querySelector('.tab-button.active')?.dataset.tab;

        if (!activeTab) return false;

        if (activeTab === 'register') {
            const username = authForm.querySelector('#register-content #register-username');
            const email = authForm.querySelector('#register-content #register-email');
            const password = authForm.querySelector('#register-content #register-password');
            const confirmPassword = authForm.querySelector('#register-content #register-confirm-password');

            if (!validateRequired(username)) isValid = false;
            if (!validateRequired(email) || !validateEmailFormat(email)) isValid = false;
            if (!validateRequired(password) || !validateMinLength(password, 6)) isValid = false;
            if (!validateRequired(confirmPassword) || (password?.value.trim() !== '' && !validatePasswordMatch(password, confirmPassword))) isValid = false;

        } else if (activeTab === 'login') {
            const usernameOrEmailInput = authForm.querySelector('#login-content #login-username');
            const passwordInput = authForm.querySelector('#login-content #login-password');

            if (!validateRequired(usernameOrEmailInput)) {
                isValid = false;
            } else {
                const loginValue = usernameOrEmailInput.value.trim();
                if (loginValue.includes('@') && !validateEmailFormat(usernameOrEmailInput)) {
                   isValid = false;
                }
            }
            if (!validateRequired(passwordInput)) {
                isValid = false;
            }
        }
        return isValid;
    };


    // --- PRODUCT DETAIL PAGE LOGIC ---
    if (window.location.pathname.includes('product-detail.html')) {
        const addToCartButton = document.querySelector('.add-to-cart-btn');
        const mainProductImageEl = document.getElementById('main-product-image');
        const productNameEl = document.getElementById('product-name');
        const productPriceEl = document.getElementById('product-price');
        const productDescContainerEl = document.getElementById('product-description');
        const thumbnailContainer = document.querySelector('.thumbnail-images'); // <-- Lấy container của thumbnail
        const urlParamsDetail = new URLSearchParams(window.location.search);
        const productIdDetail = urlParamsDetail.get('id');

        // ... (productData definition as updated above) ...
        // --- Product Data Simulation & Loading ---
        const productData = {
            // --- GUITARS ---
            guitar1: {
                name: "Guitar Acoustic ABC",
                price: 5500000,
                imageGallery: [ // <-- Sử dụng mảng cho thư viện ảnh
                    "../img/gt1.jpg", // Ảnh chính mặc định
                    "../img/gt1.jpg",
                    "../img/gt2.jpg",
                    "../img/gt3.jpg"
                ],
                description: "<p>Mô tả chi tiết cho Guitar Acoustic ABC... làm từ gỗ thông, âm thanh vang sáng.</p>",
                details: { // <-- Bổ sung details
                    "Loại đàn": "Acoustic",
                    "Mặt đàn (Top)": "Gỗ Thông Sitka (Sitka Spruce)",
                    "Lưng và Hông (Back & Sides)": "Gỗ Gụ (Mahogany)",
                    "Cần đàn (Neck)": "Gỗ Gụ (Mahogany)",
                    "Dáng đàn": "Dáng D (Dreadnought)",
                    "Màu sắc": "Tự nhiên (Natural)",
                    "Phụ kiện đi kèm": "Bao đàn, pick gảy"
                }
            },
            guitar2: {
                name: "Đàn Guitar Điện Donner DST-550, Black",
                price: 8200000,
                imageGallery: [ // <-- Sử dụng mảng cho thư viện ảnh
                    "../img/gtd1.jpg", // Ảnh chính mặc định
                    "../img/gtd1.jpg",
                    "../img/gtd2.jpg",
                    "../img/gtd3.jpg"
                ],
                description: "<p>Mô tả chi tiết cho Guitar Điện XYZ... pickup humbucker, phù hợp rock.</p>",
                details: { // <-- Bổ sung details
                   "Loại đàn": "Electric",
                   "Thân đàn (Body)": "Gỗ Đoạn (Basswood)",
                   "Cần đàn (Neck)": "Gỗ Phong (Maple)",
                   "Mặt phím (Fretboard)": "Gỗ Phong (Maple)",
                   "Kiểu dáng": "Stratocaster",
                   "Pickups": "HSS (1 Humbucker, 2 Single-Coil)",
                   "Ngựa đàn (Bridge)": "Tremolo tiêu chuẩn",
                   "Màu sắc": "Đen (Black)"
                }
            },
            guitar_donner_dst550: {
                name: "Đàn Guitar Classic Cordoba C1M 1/4",
                price: 5200000,
                imageGallery: [ // <-- Sử dụng mảng cho thư viện ảnh
                    "../img/gtl1.jpg", // Ảnh chính mặc định
                    "../img/gtl2.jpg",
                    "../img/gtl3.jpg",
                    "../img/gtl4.jpg"
                ],
                description: "<p>Guitar điện Donner DST-550 mang kiểu dáng Stratocaster cổ điển, màu đen bóng mạnh mẽ. Phù hợp cho người mới bắt đầu và chơi các thể loại như pop, rock, blues. Cần đàn C-shape tạo cảm giác chơi thoải mái, cấu hình pickup HSS (Humbucker - Single Coil - Single Coil) linh hoạt cho nhiều chất âm khác nhau.</p>",
                details: { // <-- Bổ sung details
                   "Thương hiệu": "Donner",
                   "Model": "DST-550",
                   "Loại đàn": "Electric",
                   "Kiểu dáng": "Stratocaster",
                   "Màu sắc": "Đen (Black)",
                   "Cấu hình Pickup": "HSS (1 Humbucker Alnico V, 2 Single-Coil Alnico V)",
                   "Cần đàn": "Gỗ Phong (Maple), Dáng C",
                   "Mặt phím": "Gỗ Purpleheart",
                   "Số phím": "22",
                   "Phụ kiện": "Bao đàn, dây đeo, cáp nối, pick, tuner"
                }
            },
            // --- PIANOS ---
            piano1: {
                name: "Piano Đứng Yamaha U1",
                price: 85000000,
                imageGallery: [ // <-- Sử dụng mảng cho thư viện ảnh
                    "../img/yamaha1.jpg", // Ảnh chính mặc định
                    "../img/yamaha1.jpg",
                    "../img/yamaha2.jpg",
                    "../img/yamaha3.jpg"
                ],
                description: `<p><strong>Đàn Piano Yamaha U1</strong></p><p>Piano Yamaha U1 ngay từ khi mới ra đời cho đến nay loại đàn này luôn nhận được sự ưu ái của các nhạc sỹ và nghệ sỹ đàn dương cầm chuyên nghiệp bởi kết hợp hài hòa giữa cổ điển và hiện đại...</p>`, // (Giữ nguyên mô tả dài)
                details: { // <-- Bổ sung details
                   "Thương hiệu": "Yamaha",
                   "Model": "U1",
                   "Loại đàn": "Piano Cơ Đứng (Upright Acoustic)",
                   "Số phím": "88",
                   "Số pedal": "3",
                   "Chiều cao": "121 cm",
                   "Chiều rộng": "153 cm",
                   "Chiều sâu": "61 cm",
                   "Trọng lượng": "228 kg",
                   "Hoàn thiện": "Sơn bóng (Polished Ebony)",
                   "Xuất xứ": "Nhật Bản"
                }
            },
            piano2: {
                name: "Piano Điện Casio PX-S1100",
                price: 18900000,
                imageGallery: [ 
                    "../img/pn1.jpg", // Ảnh chính mặc định
                    "../img/pn2.jpg",
                    "../img/pn3.jpg",
                    "../img/pn4.jpg"
                ],
                description: "<p>Mô tả chi tiết cho Piano Điện Casio PX-S1100... Thiết kế gọn nhẹ, nhiều tính năng.</p>",
                 details: { // <-- Bổ sung details
                   "Thương hiệu": "Casio",
                   "Model": "PX-S1100",
                   "Loại đàn": "Piano Điện (Digital Piano)",
                   "Số phím": "88 phím (Smart Scaled Hammer Action Keyboard)",
                   "Phản hồi cảm ứng": "5 mức độ nhạy",
                   "Polyphony tối đa": "192",
                   "Số âm sắc (Tones)": "18",
                   "Kết nối": "Bluetooth Audio & MIDI, USB",
                   "Loa": "8W + 8W",
                   "Màu sắc": "Đen/Trắng/Đỏ (Tùy chọn)",
                   "Phụ kiện": "Pedal SP-3, Adapter nguồn"
                }
            },
            piano3: {
                name: "Piano Điện Roland FP-30X",
                price: 19500000,
                imageGallery: [ // <-- Sử dụng mảng cho thư viện ảnh
                    "../img/pn5.jpg", // Ảnh chính mặc định
                    "../img/pn6.jpg",
                    "../img/pn7.jpg",
                    "../img/pn8.jpg"
                ],
                description: "<p>Mô tả chi tiết cho Piano Điện Roland FP-30X... Âm thanh tuyệt vời, kết nối Bluetooth.</p>",
                details: { // <-- Bổ sung details
                     "Thương hiệu": "Roland",
                        "Model": "FP-30X",
                        "Loại đàn": "Piano Điện (Digital Piano)",
                        "Số phím": "88 phím (PHA-4 Standard Keyboard)",
                        "Phản hồi cảm ứng": "3 mức độ nhạy",
                        "Polyphony tối đa": "128",
                        "Số âm sắc (Tones)": "35",
                        "Kết nối": "Bluetooth Audio & MIDI, USB",
                        "Loa": "2 x 11W",
                        "Màu sắc": "Đen/Trắng (Tùy chọn)",
                        "Phụ kiện": "Pedal DP-10, Adapter nguồn, Hướng dẫn sử dụng"
                }
             }     ,      // --- DRUMS ---
            drum1: {
                name: "Bộ Trống Jazz Pearl Roadshow",
                price: 15600000,
                imageGallery: [ // <-- Sử dụng mảng cho thư viện ảnh
                    "../img/dr1.jpg", // Ảnh chính mặc định
                    "../img/dr2.jpg",
                    "../img/dr3.jpg",
                    "../img/dr4.jpg"
                ],
                description: "<p>Mô tả chi tiết cho Bộ Trống Jazz Pearl Roadshow... Bộ trống hoàn chỉnh cho người mới bắt đầu.</p>",
                details: { // <-- Bổ sung details
                   "Thương hiệu": "Pearl",
                   "Dòng": "Roadshow",
                   "Cấu hình": "Jazz/Fusion (Thường gồm Bass 18\" hoặc 20\")",
                   "Chất liệu vỏ trống": "Gỗ Dương (Poplar) 9 lớp",
                   "Bao gồm": "Trống Bass, Snare, Tom 1, Tom 2, Floor Tom, Hi-hat Stand, Cymbal Stand, Snare Stand, Pedal Bass, Ghế trống, Cymbal (thường là Hi-hat 14\", Crash/Ride 16\")",
                   "Màu sắc": "Nhiều màu (Jet Black, Wine Red, Bronze Metallic, ...)"
                }
            },
            //Trống Điện Aroma TDX-15
            drum2: {
                name: "Trống Điện Aroma TDX-15",
                price: 8500000,
                imageGallery: [ // <-- Sử dụng mảng cho thư viện ảnh
                    "../img/dr5.jpg", // Ảnh chính mặc định
                    "../img/dr6.jpg",
                    "../img/dr7.jpg",
                    "../img/dr8.jpg"
                ],
                description: "<p>Mô tả chi tiết cho Trống Điện Aroma TDX-15... Âm thanh sống động, nhiều chế độ.</p>",
                details: { // <-- Bổ sung details
                     "Thương hiệu": "Aroma",
                        "Model": "TDX-15",
                        "Loại đàn": "Trống Điện (Electronic Drum)",
                        "Số trống": "5 trống + 3 cymbals",
                        "Chất liệu đầu trống": "Silicone",
                        "Kết nối": "USB MIDI, AUX IN/OUT, headphone jack",
                        "Chế độ âm thanh": "20 âm thanh trống khác nhau",
                        "Phụ kiện": "Adapter nguồn, tai nghe, ghế trống"
                }
            },
            violin1: {
                name: "Violin Acoustic Size 4/4",
                price: 4200000,
                imageGallery: [ // <-- Sử dụng mảng cho thư viện ảnh
                    "../img/vi1.jpg", // Ảnh chính mặc định
                    "../img/vi2.jpg",
                    "../img/vi3.jpg",
                    "../img/vi4.jpg"
                ],
                description: "<p>Mô tả chi tiết cho Violin Acoustic Size 4/4... Phù hợp cho người lớn và học sinh.</p>",
                details: { // <-- Bổ sung details
                   "Loại đàn": "Violin Acoustic",
                   "Kích thước": "4/4 (Full size)",
                   "Đối tượng": "Người lớn, học sinh từ 12 tuổi",
                   "Mặt đàn": "Gỗ Thông (Spruce)",
                   "Lưng và hông": "Gỗ Phong (Maple)",
                   "Cần và cuộn xoắn": "Gỗ Phong (Maple)",
                   "Mặt phím": "Gỗ mun hóa (Ebonized Wood) hoặc Gỗ mun (Ebony)",
                   "Phụ kiện": "Vĩ (Bow), Hộp đàn (Case), Nhựa thông (Rosin)"
                }
            },
         };
        const product = productData[productIdDetail];
        const detailContainer = document.querySelector('.product-detail-container');

        if (product && detailContainer && mainProductImageEl && thumbnailContainer) { // <-- Thêm kiểm tra thumbnailContainer
            const pageTitle = document.querySelector('title');

            if (productNameEl) productNameEl.textContent = product.name;
            if (productPriceEl && !isNaN(product.price)) {
                productPriceEl.textContent = formatCurrency(product.price);
            } else if (productPriceEl) {
                 productPriceEl.textContent = "Liên hệ";
            }
            if (pageTitle) pageTitle.textContent = `${product.name} - Nhạc Cụ Store`;

            // --- Xử lý thư viện ảnh ---
            thumbnailContainer.innerHTML = ''; // Xóa thumbnail cũ (nếu có trong HTML)

            if (product.imageGallery && product.imageGallery.length > 0) {
                // 1. Đặt ảnh chính mặc định
                mainProductImageEl.src = product.imageGallery[0]; // Lấy ảnh đầu tiên làm ảnh chính
                mainProductImageEl.alt = product.name; // Đặt alt cho ảnh chính

                // 2. Tạo các ảnh thumbnail động
                product.imageGallery.forEach((imgUrl, index) => {
                    const thumb = document.createElement('img');
                    // Bạn có thể tùy chỉnh URL thumbnail ở đây nếu có phiên bản nhỏ hơn
                    // Ví dụ: thumb.src = imgUrl.replace('/600x400/', '/100x75/');
                    // Hiện tại, dùng luôn URL gốc cho thumbnail:
                    thumb.src = imgUrl;
                    thumb.alt = `${product.name} - Ảnh chi tiết ${index + 1}`;
                    thumb.classList.add('thumbnail');
                    if (index === 0) {
                        thumb.classList.add('active'); // Đánh dấu thumbnail đầu tiên là active
                    }

                    // 3. Gắn sự kiện click cho từng thumbnail
                    thumb.addEventListener('click', () => {
                        mainProductImageEl.src = imgUrl; // Thay đổi ảnh chính khi click thumbnail
                        mainProductImageEl.alt = thumb.alt; // Cập nhật alt ảnh chính

                        // Bỏ active tất cả thumbnail khác
                        thumbnailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                        // Thêm active cho thumbnail được click
                        thumb.classList.add('active');
                    });

                    thumbnailContainer.appendChild(thumb); // Thêm thumbnail vào container
                });

            } else {
                // Trường hợp không có ảnh trong imageGallery
                mainProductImageEl.src = 'https://via.placeholder.com/600x400/EEEEEE/FFFFFF?text=No+Image+Available';
                mainProductImageEl.alt = product.name;
                thumbnailContainer.innerHTML = '<p style="font-size: 0.8em; color: #666;">Không có ảnh chi tiết.</p>';
            }
             // --- Kết thúc xử lý thư viện ảnh ---


            if (productDescContainerEl) {
                 renderProductDescription(productDescContainerEl, product.description || "<p>Không có mô tả.</p>", productIdDetail);
            }

            // Add to Cart Button Listener
            if (addToCartButton && !isNaN(product.price)) {
                addToCartButton.addEventListener('click', () => {
                    const productToAdd = {
                        id: productIdDetail,
                        name: product.name,
                        price: product.price,
                        // Lấy ảnh đầu tiên làm ảnh đại diện cho giỏ hàng
                        image: (product.imageGallery && product.imageGallery.length > 0) ? product.imageGallery[0] : 'https://via.placeholder.com/100x75',
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

        // --- Image Gallery Click Logic (Đã được tích hợp vào vòng lặp ở trên) ---
        // Đoạn code cũ xử lý click thumbnail ở đây có thể xóa đi hoặc comment lại vì đã xử lý động ở trên.

    }


    // --- CART PAGE LOGIC ---
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
                             if(removeItemFromCart(productId)) renderCartItems();
                         } else {
                              const currentCart = getCart();
                              const item = currentCart.find(i => i.id === productId);
                              inputElement.value = item ? item.quantity : 1;
                         }
                    } else {
                         if (updateItemQuantity(productId, newQuantity)) {
                              const updatedCart = getCart(); // Get the latest cart data
                              const item = updatedCart.find(i => i.id === productId);
                              const subtotalEl = cartItemElement.querySelector('.cart-item-subtotal');
                               if (subtotalEl && item) {
                                   subtotalEl.textContent = formatCurrency((item.price || 0) * (item.quantity || 0));
                               }
                              if(cartTotalPriceEl) cartTotalPriceEl.textContent = formatCurrency(getCartTotal());
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

        renderCartItems(); // Initial render

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
    } // End cart page logic


    // --- Initial Setup on Page Load (COMMON) ---
    updateHeaderUI(); // Check login status
    updateCartIcon(); // Update cart icon count


    // --- Safety: Restore scroll on page load if no modals are open ---
    window.addEventListener('load', () => {
        const modalOpen = document.getElementById('auth-modal')?.style.display === 'flex';
        const welcomeOpen = document.getElementById('welcome-notification')?.style.display === 'flex';
        if (!modalOpen && !welcomeOpen) {
            document.body.classList.remove('scroll-lock'); // Ensure scrolling is enabled
        }
    });

}); // End DOMContentLoaded