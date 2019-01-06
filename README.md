Install dependencies:

`npm install`.

Copy `config.js.dist` to `config.js`.

Add accounts in `config.js`, for example

```
// ...
    accounts: [797040, 796695, 993968],
// ...
```

Then set the exported private key and the used password.

```
// ...
    key: {
        pk: 'ABCDEF....',
        pw: 'password'
    }
// ...
```

Run via `node spam.js`.