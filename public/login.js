
  function signin() {
    let mail = document.querySelector('#mail1');
    mail = mail.value;
    let password = document.querySelector('#pass1');
    password = password.value;
    let username = document.querySelector('#username1');
    username = username.value;

    console.log(mail, password);

    fetch(`http://localhost:3000/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mail, password })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data.msg);
        window.location.href="/home"
    })
    .catch(err => {
        console.error('Signin request failed:', err);
    });
}

    function signup() {
    let mail = document.querySelector('#mail');
    mail = mail.value;
    let pass = document.querySelector('#pass');
    pass = pass.value;
    let username = document.querySelector('#username');
    username = username.value;

    console.log(mail, pass);

    fetch(`http://localhost:3000/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail, pass, username })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data.msg);
    })
    .catch(err => {
        console.error('Signup request failed:', err);
    });
}
