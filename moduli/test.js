function log(t, m, color='red') {
    let title = t.toUpperCase();
    title = (color == 'red') ? t.brightRed :
            (color == 'green') ? t.brightGreen :
            (color == 'cyan') ? t.brightCyan :
            t;
    console.log(`[${title}] ${m}`)
}