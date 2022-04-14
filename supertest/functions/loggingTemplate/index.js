function lambda(input, callback) {
    console.debug("Debugging log");
    console.warn("Warn log");
    setTimeout(() => {
        callback(null, `Hello World`);
    }, 31 * 1000)
}