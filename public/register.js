
const form = document.getElementById('reg-form');

form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('pwd').value;
    const confirmPassword = document.getElementById('confirmPwd').value;

    if (password !== confirmPassword) {
        alert('密碼與確認密碼不符');
        return;
    }

    addUser(name, email, password);
});

function addUser(name, email, password) {
    fetch('/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    }
    )
        .then(res => res.text())
        .then(data => alert(data))
        .catch(err => console.error(err));
}