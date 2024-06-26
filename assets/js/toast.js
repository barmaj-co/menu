function showErrorToast(message) {
    var toastHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${message}
        </div>
    `;
    
    $('#toastContainer').append(toastHTML);
    $('.toast').toast('show');

    setTimeout(() => $('#toastContainer').empty(), 2000);
}


function showSuccessToast(message) {
    var toastHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${message}
        </div>
    `;
    
    $('#toastContainer').append(toastHTML);
    $('.toast').toast('show');

    setTimeout(() => $('#toastContainer').empty(), 2000);
}
