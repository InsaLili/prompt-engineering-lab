=== No system prompt ===
A debounce function is a higher-order function that limits the rate at which a function can fire. It ensures that a function is only executed after a specified delay has passed since the last time it was invoked. This is particularly useful for scenarios like handling window resizing, scrolling events, and input validation, where you want to avoid excessive calls to a function.

Here’s a simple implementation of a debounce function in JavaScript:

```javascript
function debounce(func, delay) {
    let timeoutId;

    return function(...args) {
        const context = this;

        // Clear the previous timeout
        clearTimeout(timeoutId);

        // Set a new timeout
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// Example usage:
const handleResize = debounce(() => {
    console.log('Window resized!');
}, 300);

window.addEventListener('resize', handleResize);
```

### Explanation:
- **`debounce(func, delay)`**: The function takes two parameters: `func`, which is the function to be debounced, and `delay`, which is the time in milliseconds to wait before invoking `func`.
- **`timeoutId`**: A variable to store the identifier of the timeout.
- **`return function(...args)`**: Returns a new function that captures the context (`this`) and arguments (`args`) for the original function.
- **`clearTimeout(timeoutId)`**: Clears any existing timeout, ensuring that the previous invocation of `func` is canceled if the debounced function is called again within the delay period.
- **`setTimeout`**: Sets a new timeout to call `func` after the specified `delay`.

This implementation will ensure that `func` is only called once the user has stopped triggering the debounced function for the specified amount of time.

=== With system prompt ===
```javascript
function debounce(func, delay) {
    let timeoutId;

    return function(...args) {
        // Clear the previous timeout
        clearTimeout(timeoutId);
        // Set a new timeout
        timeoutId = setTimeout(() => {
            func.apply(this, args); // Call the function with the correct context and arguments
        }, delay);
    };
}
```

=== Pre-filled assistant turn ===
```js
```javascript
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
```

--- Usage ---
plain: {
  prompt_tokens: 12,
  completion_tokens: 376,
  total_tokens: 388,
  prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
  completion_tokens_details: {
    reasoning_tokens: 0,
    audio_tokens: 0,
    accepted_prediction_tokens: 0,
    rejected_prediction_tokens: 0
  }
}
constrained: {
  prompt_tokens: 43,
  completion_tokens: 77,
  total_tokens: 120,
  prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
  completion_tokens_details: {
    reasoning_tokens: 0,
    audio_tokens: 0,
    accepted_prediction_tokens: 0,
    rejected_prediction_tokens: 0
  }
}
prefilled: {
  prompt_tokens: 31,
  completion_tokens: 51,
  total_tokens: 82,
  prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
  completion_tokens_details: {
    reasoning_tokens: 0,
    audio_tokens: 0,
    accepted_prediction_tokens: 0,
    rejected_prediction_tokens: 0
  }
}