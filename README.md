# Trapping Rain Water Visualization

A React + TypeScript + D3.js application that visualizes the "Trapping Rain Water" algorithm (LeetCode problem #42).

## Problem Description

Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

![Trapping Rain Water Example](https://assets.leetcode.com/uploads/2018/10/22/rainwatertrap.png)

## Features

- Interactive visualization of the trapping rain water problem
- D3.js-powered SVG graphing
- TypeScript for type safety
- Intuitive UI to understand the algorithm

## Running the Application

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Algorithm Explanation

The visualization implements the two-pointer technique to calculate trapped water:

1. For each position, we need to find the maximum height to its left and right
2. The water trapped at each position is min(leftMax, rightMax) - height[i]
3. Sum up all trapped water to get the total

## Technologies Used

- React
- TypeScript
- D3.js
- Create React App
