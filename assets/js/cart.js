var selectedProduct;

function addToCart(id) {
    if (providerInfo?.disableCart) {
        $("#disableCartModal").modal('show');
        return;
    }

    for (const productArray of getMenuItems().map(item => item.items)) {
        selectedProduct = productArray.find(product => +product.id === id);
        if (selectedProduct) break;
    }

    $('.product-images-slider').empty();
    $('.modal-carousel-indicators').empty();

    let images = [selectedProduct?.imagePath];
    for (let index = 0; index < images.length; index++) {
        let imageSlider = `<div class="carousel-item ${index == 0 ? "active" : ""}">
                                <img src="${selectedProduct?.imagePath}" class="d-block w-100" alt="...">
                            </div>`;

        $('.product-images-slider').append(imageSlider);

        let btnSliderControl = `<button type="button" data-bs-target="#item-slider" data-bs-slide-to="${index}" class="${index == 0 ? "active" : ""}"
                    aria-label="Slide ${index}" aria-current="true"></button>`;
        $('.modal-carousel-indicators').append(btnSliderControl);
    }

    $(".product__details--info__title").text(selectedProduct?.name);
    $(".product__details--info__price .current__price").text(selectedProduct?.price);
    $(".product__details--info__desc").text(selectedProduct?.description);
    $(".quantity__box .quantity__number").val(1);
    $(".product-total-price").text(selectedProduct?.price);

    $('#productModal').modal('show');
}

function closeCartModal() {
    selectedProduct = {};
    $('#productModal').modal('hide');
    $('#cartCheckoutModal').modal('hide');
}

function onIncrease() {
    let currentQuantity = +$(".quantity__box .quantity__number").val();
    $(".quantity__box .quantity__number").val(currentQuantity + 1);
    calcProductTotalPrice();
}

function onDecrease() {
    let currentQuantity = +$(".quantity__box .quantity__number").val();
    if (currentQuantity === 1) return;

    $(".quantity__box .quantity__number").val(currentQuantity - 1);
    calcProductTotalPrice();
}

function calcProductTotalPrice() {
    let currentQuantity = +$(".quantity__box .quantity__number").val();
    let totalPrice = selectedProduct?.price * currentQuantity;
    $(".product-total-price").text(totalPrice);
}

function onAddToCart() {
    selectedProduct.quantity = +$(".quantity__box .quantity__number").val();
    let cart = addToLocalStorage(selectedProduct);

    $(".header .cart-counter").text(cart?.length);
    closeCartModal();
}

function getCartItems() {
    return JSON.parse(localStorage.getItem('cart')) ?? [];
}

function getClientCachedInfo() {
    let cachedInfo = JSON.parse(localStorage.getItem('client-info')) ?? {};
    return {
        names: cachedInfo?.names,
        numbers: cachedInfo?.numbers,
        addresses: cachedInfo?.addresses
    };
}

function setClientCachedInfo(name, number, address) {
    let cachedInfo = JSON.parse(localStorage.getItem('client-info')) ?? {};

    cachedInfo.names = cachedInfo?.names ?? [];
    if (!cachedInfo?.names?.includes(name)) {
        cachedInfo?.names?.push(name);
    }

    cachedInfo.numbers = cachedInfo?.numbers ?? [];
    if (!cachedInfo?.numbers?.includes(number)) {
        cachedInfo?.numbers?.push(number);
    }

    cachedInfo.addresses = cachedInfo?.addresses ?? [];
    if (!cachedInfo?.addresses?.includes(address)) {
        cachedInfo?.addresses?.push(address);
    }

    localStorage.setItem('client-info', JSON.stringify(cachedInfo));
}

function addToLocalStorage(selectedProduct) {
    if (localStorage.getItem("providerName") && ($(".page-title .provider-name").text() != localStorage.getItem("providerName"))) {
        showErrorToast("لا يمكن اضافة منتجات من متجر مختلف");
        return;
    }

    let cart = getCartItems().filter(r => r.name != selectedProduct?.name);
    cart.push(selectedProduct);
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.removeItem("providerName");
    localStorage.setItem("providerName", $(".page-title .provider-name").text());
    return cart;
}

function onOpenCartCheckoutModal() {
    if (providerInfo?.disableCart) {
        $("#disableCartModal").modal('show');
        return;
    }

    if(localStorage.getItem("providerName")){
        $(".checkout-provider-name").text("");
        $(".checkout-provider-name").text(` - ${localStorage.getItem("providerName")}`);
    }

    document.getElementById('cartCheckoutModalProducts').innerHTML = '';
    let cart = getCartItems();
    if (cart.length > 0) {
        cart.sort((a, b) => a.name?.localeCompare(b.name));
        cart.forEach(product => {
            var template = document.getElementById('cartCheckoutProductTemplate').innerHTML;
            var productHtml = template.replaceAll("__Name__", product.name)
                .replaceAll("__ConcatName__", product.name.replaceAll(" ", "-"))
                .replaceAll("__Price__", product.price * product.quantity)
                .replaceAll("__Qty__", product.quantity);
            document.getElementById('cartCheckoutModalProducts').insertAdjacentHTML('beforeend', productHtml);
        });
    }
    else {
        $("#cartCheckoutModalProducts").append("<div class='text-center'>لا يوجد منتجات</div>");
    }

    $(".checkout-total-price").text(cart.reduce((acc, product) => acc + (product.price * product.quantity), 0));

    onLoadAutoComplete();
    $('#cartCheckoutModal').modal('show');
}

function onIncreaseCheckout(productName) {
    let product = getCartItems().find(p => p.name === productName);
    if (!product) return;

    product.quantity += 1;
    calcCheckoutPrice(product);
}

function onDecreaseCheckout(productName) {
    let product = getCartItems().find(p => p.name === productName);
    if (!product || product?.quantity === 1) return;

    product.quantity -= 1;
    calcCheckoutPrice(product);
}

function onRemoveCheckout(productName) {
    let cart = getCartItems();
    let product = cart.find(p => p.name === productName);
    if (!product) return;

    cart = cart.filter(p => p.name !== productName);
    $(".header .cart-counter").text(cart.length);
    
    if(cart?.length == 0) {
        localStorage.removeItem("providerName");
        $(".checkout-provider-name").text("");
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    onOpenCartCheckoutModal();
}

function calcCheckoutPrice(product) {
    let cart = addToLocalStorage(product);
    $(".cart-checkout-product input.quantity__number-" + product.name.replaceAll(" ", "-")).val(product.quantity);
    $(".cart-checkout-product .current__price-" + product.name.replaceAll(" ", "-")).text(product.quantity * product.price);
    $(".checkout-total-price").text(cart?.reduce((acc, product) => acc + (product.price * product.quantity), 0));
}

function onSendWhatsappOrder() {
    let cart = getCartItems();
    if (cart.length == 0) {
        showErrorToast("يرجى اختيار المنتجات");
        return;
    }

    let clientName = $("#clientName").val();
    if (!clientName) {
        showErrorToast("يرجى ادخال الاسم");
        return;
    }

    let clientNumber = $("#clientNumber").val();
    if (!clientNumber) {
        showErrorToast("يرجى ادخال رقم الهاتف");
        return;
    }

    let clientAddress = $("#clientAddress").val();
    setClientCachedInfo(clientName, clientNumber, clientAddress);


    let encodedMessage = encodeURIComponent(getWhatsappMsg(cart, clientName, clientAddress, clientNumber));
    window.open(`https://api.whatsapp.com/send?phone=+2${providerInfo?.whatsappNumber}&text=${encodedMessage}`, '_blank');

    $(".cart-counter").text("0");
    localStorage.setItem('cart', JSON.stringify([]));

    $("#clientName").val("");
    $("#clientNumber").val("");
    $("#clientAddress").val("");
    closeCartModal();
    showSuccessToast("تم ارسال الطلب بنجاح");
}

function getWhatsappMsg(cart, name, address, mobile) {
    let whatsappMessage = `مرحبا,\n`;
    whatsappMessage += `الاصناف\n\n`;

    cart.forEach(cartProduct => {
        whatsappMessage += `*${cartProduct?.name}*\n`;
        whatsappMessage += `الكمية: *${cartProduct?.quantity}*\n`;
        whatsappMessage += `السعر: *${cartProduct?.price * cartProduct?.quantity}*\n`;
    });

    // if (tableNumber)
    //     whatsappMessage += `\nTable Number: *${tableNumber}*`;
    whatsappMessage += `----------------\n`;
    whatsappMessage += `الاجمالى: *${$(".checkout-total-price").text()}* ج\n\n`;

    whatsappMessage += `اسم العميل: *${name}*\n`;
    whatsappMessage += `رقم الهاتف: *${mobile}*\n`;
    if (address)
        whatsappMessage += `العنوان: *${address}*\n`;

    whatsappMessage += `\n----------------\n`;
    whatsappMessage += `شكرا لتواصلكم .\n`;
    whatsappMessage += `*${providerInfo?.brandName}*`;
    return whatsappMessage;
}

function onLoadAutoComplete() {
    $("#clientName").autocomplete({
        source: getClientCachedInfo()?.names
    });
    $("#clientNumber").autocomplete({
        source: getClientCachedInfo()?.numbers
    });
    $("#clientAddress").autocomplete({
        source: getClientCachedInfo()?.addresses
    });
}
