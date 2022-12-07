// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/horizontal-bar-chart
function BarChartHorizontal(data, elementId, {
  x = d => d, // given d in data, returns the (quantitative) x-value
  y = (d, i) => i, // given d in data, returns the (ordinal) y-value
  title, // given d in data, returns the title text
  marginTop = 30, // the top margin, in pixels
  marginRight = 0, // the right margin, in pixels
  marginBottom = 10, // the bottom margin, in pixels
  marginLeft = 30, // the left margin, in pixels
  width = 640, // the outer width of the chart, in pixels
  height, // outer height, in pixels
  xType = d3.scaleLinear, // type of x-scale
  xDomain, // [xmin, xmax]
  xRange = [marginLeft, width - marginRight], // [left, right]
  xFormat, // a format specifier string for the x-axis
  xLabel, // a label for the x-axis
  yPadding = 0.1, // amount of y-range to reserve to separate bars
  yDomain, // an array of (ordinal) y-values
  yRange, // [top, bottom]
  color = "currentColor", // bar fill color
  titleColor = "white", // title fill color when atop bar
  titleAltColor = "currentColor", // title fill color when atop background
  maxBarHeight = 80,    // maximum bar height
  target,
} = {}) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);

  // Compute default domains, and unique the y-domain.
  if (xDomain === undefined) xDomain = [0, d3.max(X)];
  if (yDomain === undefined) yDomain = Y;
  yDomain = new d3.InternSet(yDomain);

  // Omit any data not present in the y-domain.
  const I = d3.range(X.length).filter(i => yDomain.has(Y[i]));

  // Compute the default height.
  if (height === undefined) height = Math.ceil((yDomain.size + yPadding) * 25) + marginTop + marginBottom;
  if (yRange === undefined) yRange = [marginTop, height - marginBottom];

  // Construct scales and axes.
  const xScale = xType(xDomain, xRange);
  const yScale = d3.scaleBand(yDomain, yRange).padding(yPadding);
  const xAxis = d3.axisTop(xScale).ticks(width / 80, xFormat);
  const yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

  // Compute titles.
  if (title === undefined) {
    const formatValue = xScale.tickFormat(100, xFormat);
    title = i => `${formatValue(X[i])}`;
  } else {
    const O = d3.map(data, d => d);
    const T = title;
    title = i => T(O[i], i, data);
  }
  // put a limit to how thick a bar can be!
  let barHeight;
  if (maxBarHeight < yScale.bandwidth()) barHeight = maxBarHeight;
  else barHeight = yScale.bandwidth();

  const svg = d3.select('#' + elementId)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
      .attr("transform", `translate(0,${marginTop})`)
      .call(xAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("y2", height - marginTop - marginBottom)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", width - marginRight)
          .attr("y", -22)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text(xLabel));
  
  // add a target line if it is defined
  if (target != undefined) {
    svg.append("line")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 1)
      .attr("x1", xScale(target))
      .attr("x2", xScale(target))
      .attr("y1", yRange[0] + 10)
      .attr("y2", yRange[1] - 10)
  }

  svg.append("g")
      .attr("fill", color)
    .selectAll("rect")
    .data(I)
    .join("rect")
      .attr("x", xScale(0))
      .attr("y", i => yScale(Y[i]) + yScale.bandwidth() / 2 - barHeight / 2)
      .attr("width", i => xScale(X[i]) - xScale(0))
      .attr("height", barHeight);

  svg.append("g")
      .attr("fill", titleColor)
      .attr("text-anchor", "end")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
    .selectAll("text")
    .data(I)
    .join("text")
      .attr("x", i => xScale(X[i]))
      .attr("y", i => yScale(Y[i]) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("dx", -4)
      .text(title)
      .call(text => text.filter(i => xScale(X[i]) - xScale(0) < 20) // short bars
          .attr("dx", +4)
          .attr("fill", titleAltColor)
          .attr("text-anchor", "start"));

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis);

  //return svg.node();
}

function BarChartVertical(data, elementId, {
  x = (d, i) => i, // given d in data, returns the (ordinal) x-value
  y = d => d, // given d in data, returns the (quantitative) y-value
  z = () => 1, // given d in data, returns the (categorical) z-value
  title, // given d in data, returns the title text
  marginTop = 20, // the top margin, in pixels
  marginRight = 0, // the right margin, in pixels
  marginBottom = 30, // the bottom margin, in pixels
  marginLeft = 40, // the left margin, in pixels
  width = 640, // the outer width of the chart, in pixels
  height = 400, // the outer height of the chart, in pixels
  xDomain, // an array of (ordinal) x-values
  xRange = [marginLeft, width - marginRight], // [left, right]
  xType = d3.scaleBand,   // x-scale type
  yType = d3.scaleLinear, // y-scale type
  yDomain, // [ymin, ymax]
  yRange = [height - marginBottom, marginTop], // [bottom, top]
  xPadding = 0.1, // amount of x-range to reserve to separate bars
  yFormat, // a format specifier string for the y-axis
  yLabel, // a label for the y-axis
  zDomain,  // array of z-values
  zPadding = 0,  // amount of x-range to reserve to separate bars, put 0 if no z
  colors = d3.schemeTableau10, // // array of bar fill colors
  maxBarWidth = 80,   // maximum bar width
  target,     // put a target to chart
} = {}) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const Z = d3.map(data, z);
  
  // Compute default domains, and unique the x-domain.
  if (xDomain === undefined) xDomain = X;
  if (yDomain === undefined) yDomain = [0, d3.max(Y)];
  if (zDomain === undefined) zDomain = Z;
  xDomain = new d3.InternSet(xDomain);
  zDomain = new d3.InternSet(zDomain);

  if (yDomain[1] < target) yDomain[1] = target;

  // Omit any data not present in both the x- and z-domain.
  const I = d3.range(X.length).filter(i => xDomain.has(X[i]) && zDomain.has(Z[i]));

  // Construct X scales
  const xScale = xType(xDomain, xRange).paddingInner(xPadding);
  const xzScale = d3.scaleBand(zDomain, [0, xScale.bandwidth()]).padding(zPadding);

  // determine bar width
  let barWidth;
  if (maxBarWidth < xzScale.bandwidth()) barWidth = maxBarWidth;
  else barWidth = xzScale.bandwidth();

  // adjust graph area in case tick labels overwrite issue
  const longestString = X.reduce((a, b) => {
    return a.length > b.length ? a:b;
  });
  const stringSpace = longestString.length * 6
  // if bar width is smaller than string space, need to rotate x tick texts
  // firstly, the x axis must be lifted up to provide space to rotated tick
  if (xScale.bandwidth() < stringSpace) {
    marginBottom += stringSpace * Math.sin(Math.PI * 0.17);
    yRange[0] = height - marginBottom;
  }

  // construct other scales
  const yScale = yType(yDomain, yRange);
  const zScale = d3.scaleOrdinal(zDomain, colors);

  // construct axes
  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

  // Compute titles (small pop-up when mouse hovering)
  if (title === undefined) {
    const formatValue = yScale.tickFormat(100, yFormat);
    if (zPadding == 0) title = i => `${X[i]}\n${formatValue(Y[i])}`;
    else title = i => `${X[i]}\n${Z[i]}\n${formatValue(Y[i])}`;
  } else {
    const O = d3.map(data, d => d);
    const T = title;
    title = i => T(O[i], i, data);
  }

  const svg = d3.select('#' + elementId)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(yLabel));
  
  // add a target line if it is defined
  if (target != undefined) {
    svg.append("line")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 1)
      .attr("x1", xRange[0] + 10)
      .attr("x2", xRange[1] - 10)
      .attr("y1", yScale(target))
      .attr("y2", yScale(target))
  }

  const bar = svg.append("g")
    .selectAll("rect")
    .data(I)
    .join("rect")
      .attr("x", i => xScale(X[i]) + xzScale(Z[i]) + xzScale.bandwidth() / 2 - barWidth / 2)
      .attr("y", i => yScale(Y[i]))
      .attr("height", i => yScale(0) - yScale(Y[i]))
      .attr("width", barWidth)
      .attr("fill", i => zScale(Z[i]));

  if (title) bar.append("title")
      .text(title);

  const xTicks = svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis)
  
  // rotate x ticks text 30 degree down if text overrides
  if (xScale.bandwidth() < stringSpace) {
    xTicks.selectAll("text")
      .attr("dx", "-0.5em")
      .attr("dy", "0.3em")
      .attr("transform", "rotate(-30)")
      .attr("text-anchor", "end")
  }
  //return svg.node();
}

function MeterChart(value, elementId, {
  title,
  marginTop = 20, // the top margin, in pixels
  marginRight = 15, // the right margin, in pixels
  marginBottom = 30, // the bottom margin, in pixels
  marginLeft = 15, // the left margin, in pixels
  paddingBottom = 20,
  colorValue = "steelblue",
  colorBlank = "#F5F5F5",
  startValue = 0,
  endValue = 2,
  width = 200,
  height = 100,
  target
} = {}) {
  // setting up data. `value` is percentage (should be less than 2)
  const text = value.toFixed(2) + '%';
  const data = [value - startValue, endValue - value - startValue];
  const anglesRange = 0.5 * Math.PI;
  const radis = Math.min(width, 2*height) / 2 - 1.8*paddingBottom;
  const thickness = radis / 3;
  const colors = [colorValue, colorBlank];

  const pies = d3.pie()
    .value(d => d)
    .sort(null)
    .startAngle(anglesRange * -1)
    .endAngle(anglesRange)

  const arc = d3.arc()
    .outerRadius(radis)
    .innerRadius(radis - thickness)

  const translation = (x, y) => `translate(${x}, ${y})`

  const svg = d3.select('#' + elementId).append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("padding-bottom", paddingBottom)
    .append("g")
    .attr("transform", translation(width / 2, height - paddingBottom))
  
  if (title) {
    svg.append("text").text(title)
      .attr("dy", -radis-10 + "px")
      .attr("dx", -radis + "px")
      .attr("text-anchor", "start")
      .attr("font-size", radis / 5 + "px")
      .attr("font-weight", "bold")
  }

  svg.selectAll("path")
    .data(pies(data))
    .enter()
    .append("path")
    .attr("fill", (_, i) => colors[i])
    .attr("d", arc)

  svg.append("text")
    .text(text)
    .attr("dy", "-" + radis/15 +"px")
    .attr("text-anchor", "middle")
    .attr("font-size", radis / 3 + 'px')
  
  svg.append("text")
    .text(startValue + '%')
    .attr("dy", paddingBottom + "px")
    .attr("dx", -(radis - thickness/2))
    .attr("text-anchor", "middle")

  svg.append("text")
    .text(endValue + '%')
    .attr("dy", paddingBottom + "px")
    .attr("dx", radis - thickness/2)
    .attr("text-anchor", "middle")
  
  // add a target line if it is defined
  if (target != undefined) {
    // calculate reference points using trigonometry
    const flipper = target - startValue < (endValue - startValue) / 2 ? -1:1;
    const outerX = -1 * radis * Math.cos(Math.PI * target / endValue);
    const outerY = -1 * radis * Math.sin(Math.PI * target / endValue);
    const innerX = -1 * (radis - thickness) * Math.cos(Math.PI * target / endValue);
    const innerY = -1 * (radis - thickness) * Math.sin(Math.PI * target / endValue);

    svg.append("line")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 1)
      .attr("x1", (outerX + flipper * 3) + "px")
      .attr("x2", innerX + "px")
      .attr("y1", (outerY - 3) + "px")
      .attr("y2", innerY + "px")
    
      svg.append("text")
        .text(target + '%')
        .attr("dx", (outerX + flipper * 3) + "px")
        .attr("dy", (outerY - 3) + "px")
        .attr("text-anchor", "end")
        .attr("font-size", radis / 8 + 'px')
  }
}