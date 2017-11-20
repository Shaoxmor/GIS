$(document).ready(function () {
  $('#btn-submit').click(function () {
    if ($('#input-username').val() === 'root' && $('#input-password').val() === '123456') {
      location.href='http://127.0.0.1:8080'
    } else {
    }
  })
})