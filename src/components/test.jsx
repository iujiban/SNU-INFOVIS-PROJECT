import React, { useState, useEffect } from 'react';

function Counter() {
    const [count, setCount] = useState(0);
    const [isOdd, setIsOdd] = useState(false);

    const handleClick = () => {
        setCount((prevCount) => {
            console.log("Previous count:", prevCount); // Logs the current state before update
            return prevCount + 1; // Updates state based on the previous value
        });
    };

    // React to the updated `count` state to calculate odd/even
    useEffect(() => {
        console.log("Count updated to:", count); // Logs the new count
        setIsOdd(count % 2 !== 0);
    }, [count]); // This runs every time `count` is updated

    return (
        <div>
            <p>Count: {count}</p>
            <p>{isOdd ? "The count is odd" : "The count is even"}</p>
            <button onClick={handleClick}>Increment</button>
        </div>
    );
}

export default Counter;