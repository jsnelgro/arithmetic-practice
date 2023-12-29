import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

export const heatmapPlot = (heatmapView, calcProblemStats, setHighlightedProblem) => {
    const computeColorOptions = () => {
        switch (heatmapView) {
            case "correctPercent":
                return { scheme: "RdYlGn", reverse: false, pivot: 75 }
            case "responseTime":
                return { scheme: "RdYlGn", reverse: true, pivot: 4 }
            default:
                return { scheme: "rdylbu", reverse: false }
        }
    }

    const computeText = (d) => {
        switch (heatmapView) {
            case "correctPercent":
                return d.correctPercent ? d.correctPercent.toFixed(1) + "%" : undefined
            case "responseTime":
                return d.responseTime ? d.responseTime + "s" : undefined
            default:
                return d[heatmapView] ?? undefined
        }
    }
    const problems = Array(10).fill(0)
        .flatMap((_, i) => Array(10).fill(0).map((_, j) => ({ a: i + 1, b: j + 1 })))
        .map(it => {
            const stats = calcProblemStats(`${it.a}*${it.b}`)
            return { ...it, ...stats }
        })
        .filter(it => (it?.responseTime ?? 0) < 10) // filter outliers (problems that took more than 10 seconds)

    const p = Plot.plot({
        padding: 0,
        aspectRatio: 1,
        x: { axis: "top" },
        color: computeColorOptions(),
        marks: [
            Plot.frame(),
            Plot.cell(problems, { x: "a", y: "b", fill: heatmapView }),
            Plot.text(problems, { x: "a", y: "b", text: (d) => computeText(d) }),
            Plot.tip(problems, Plot.pointer({
                x: "a", y: "b",
                filter: (d) => d.timesSeen > 0,
                channels: {
                    correctPercent: (d) => d.correctPercent + "%",
                    responseTime: (d) => d.responseTime + "s",
                    timesSeen: "timesSeen",
                },
            })),
        ]
    })

    p.addEventListener("input", (event) => {
        if (p?.value?.a === undefined) return;
        setHighlightedProblem(`${p.value.a}*${p.value.b}`);
    });

    return p
}

// time series plot of response time for a given problem
export const responseTimeTsPlot = (stats, highlightedProblem) => {
    const data = Object.values(stats.responseTimesPerProblem).flatMap(problem =>
        problem.submissions.map(s => ({
            name: problem.name,
            ...s,
            createdAt: new Date(s.createdAt),
            responseTimeS: s.responseTimeMs / 1000,
        })))
        .filter(it => it.isCorrect && it.name === highlightedProblem)
        .filter(it => (it?.responseTimeS ?? 0) < 10) // filter outliers (problems that took more than 10 seconds)
        .toSorted((a, b) => a.createdAt < b.createdAt ? -1 : 1)

    const metric = "responseTimeS" // "responseTimeS"

    return Plot.plot({
        title: `Response Time Trend For ${highlightedProblem}`,
        y: { nice: true },
        x: { nice: true },
        marks: [
            Plot.frame(),
            Plot.dotY(data, {
                x: "createdAt",
                y:  metric,
                fill: "name",
            }),
            Plot.lineY(data, Plot.windowY({ k: 2 }, { x: "createdAt", y: metric, stroke: "median", curve: "auto" })),
            Plot.tip(data, Plot.pointer({ x: "createdAt", y: metric, channels: { problem: "name" } })),
        ]
    })
}