import numpy as np


def extract_ppg_features(signal):
    """Extract a compact feature vector from one PPG segment."""
    arr = np.asarray(signal, dtype=float)
    if len(arr) < 3:
        return np.zeros(10, dtype=float)

    mean = np.mean(arr)
    std = np.std(arr)
    safe_std = max(std, 1e-7)
    centered = arr - mean

    maximum = np.max(arr)
    minimum = np.min(arr)
    signal_range = maximum - minimum
    rms = np.sqrt(np.mean(np.square(arr)))
    energy = np.mean(np.square(arr))
    mean_abs_diff = np.mean(np.abs(np.diff(arr)))
    zero_crossings = np.sum(np.abs(np.diff(np.sign(centered)))) / 2
    skewness = np.mean(np.power(centered, 3)) / (safe_std**3)
    kurtosis = np.mean(np.power(centered, 4)) / (safe_std**4)

    return np.array(
        [
            mean,
            std,
            maximum,
            minimum,
            signal_range,
            rms,
            energy,
            mean_abs_diff,
            skewness,
            kurtosis,
        ],
        dtype=float,
    )
