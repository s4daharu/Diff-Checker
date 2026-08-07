export const SAMPLE_ORIGINAL = `def greet(name):
    # Say hello to the user
    message = "Hello, " + name + "!"
    print(message)


def calculate(a, b):
    return a * b


if __name__ == "__main__":
    greet("World")`;

export const SAMPLE_CHANGED = `def greet(name):
    """Print a friendly greeting."""
    message = f"Hello, {name}!"
    print(message)


def multiply(a, b, c=1):
    return a * b * c


def square(x):
    return multiply(x, x)


if __name__ == "__main__":
    greet("World")
    print(square(7))`;
