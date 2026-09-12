const bad = 'onflag {\n  onclick {\n    goto_random_position;\n  }\n}';
const res = await fetch('http://localhost:8000/validate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({source: bad}),
});
console.log(res.status);
console.log((await res.text()).slice(0, 400));
