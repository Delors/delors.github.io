from typing import TypeVar

T = TypeVar("T")

def linear_interpolating_search(A : List[T], needle) -> (T, int):
    steps = 0
    lower = 0
    upper = len(A) - 1
    vL = A[lower]
    if vL == needle:
        return (lower, steps)
    vU = A[upper]
    if vU == needle:
        return (upper, steps)

    while upper > lower:
        steps += 1
        pos = round(
            lower * (needle - vU) / (vL - vU) + upper * (needle - vL) / (vU - vL)
        )
        pos = max(lower + 1, min(upper - 1, pos))
        print(f"lower: {lower}, upper: {upper} => pos: {pos}")
        value = A[pos]
        if value == needle:
            return (pos, steps)
        elif value < needle:
            lower = max(pos, lower + 1)
            vL = A[lower]
        else:
            upper = min(upper - 1, pos)
            vU = A[upper]

    return (None, steps)


def eval(name, A):
    min = A[0] - 1
    max = A[len(A) - 1] + 1
    steps = 0
    value = 0
    for i in range(min, max):
        (index, this_steps) = linear_interpolating_search(A, i)
        if this_steps > steps:
            steps = this_steps
            value = i
        print(f"Gefundener Index für {i} in {name}: {index} [steps: {this_steps}]\n")
    print(f"Maximale Schritte: {steps} für Wert: {value}\n")


eval("A", [1, 3, 5, 7, 9, 11, 13, 15])
print("\n\n\n-----------------------------------------------------------")
eval("B", [0, 7, 13, 22, 27, 32, 44, 49])
print("\n\n\n-----------------------------------------------------------")
eval("C", [0, 4, 16, 36, 64, 100, 144, 196])  
