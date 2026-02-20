// Handwritten debounce — no lodash, no libraries.
//
// How it works: the outer function creates a *closure* over `timer`.
// Every returned function call shares that same `timer` variable.
// This is the key insight — without the closure, each call would have
// its own independent timer and nothing would ever get cancelled.
//
// When the user types rapidly, each keystroke calls the returned function.
// Each call clears the *previous* timer (because they all share `timer`
// through the closure) and sets a new one. The callback only fires once
// the user stops typing for `delay` ms. 10 keystrokes = 1 save.

export default function debounce(fn, delay) {
    // This variable persists across calls because it lives in the
    // closure scope of the outer function, not inside the returned one.
    let timer = null

    return function debounced(...args) {
        // If there's already a pending timer, kill it.
        // This is what makes rapid calls collapse into one.
        if (timer) clearTimeout(timer)

        timer = setTimeout(() => {
            fn.apply(this, args)
            timer = null
        }, delay)
    }
}
