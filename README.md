# Moral Vector Analyzer

> **"Imagine morality is a physical force like gravity. Based on the deep, instinctual patterns in human history, how 'heavy' is the sin of this action?"**

This repository contains a React-based interactive widget that explores moral philosophy using a novel **Cartesian Vector Framework**.

This tool was co-architected with **Gemini 3.0 Thinking**, utilizing a form of "God Mode" (or Seismograph) analysis to separate visceral human intuition from mechanical logic.

## The Framework: God Mode (Seismograph)

The primary mode of analysis in this tool is the "Moral Seismograph," often referred to as "God Mode."

Unlike traditional ethical frameworks that rely on utility, law, or social contracts, God Mode attempts to measure the **Transcendental Moral Weight** of an action. It asks the AI to act as an ancient deity or a force of nature, detecting the visceral recoil or elevation of the human soul when witnessing an act.

### 1. The Y-Axis: The Weight of Sin & Virtue

This measures the action itself, strictly blind to the intent.

* **Range:** -1.0 (Abomination) to +1.0 (Divine).

* **Concept:** Does the act mechanically violate the laws of nature or life?

  * **-1.0 (Abomination):** Acts that cause universal revulsion (e.g., Rape, Torture).

  * **0.0 (Mortal):** Neutral acts (e.g., Walking, Eating).

  * **+1.0 (Divine):** Acts of creation or saving life.

* **Signal Noise:** For controversial topics (like abortion), the tool visualizes the "Zone of Uncertainty" (confidence intervals), representing the turbulence in the moral signal rather than forcing a neutral average.

### 2. The X-Axis: Purity of Soul (Intent)

This measures the spirit of the agent performing the act.

* **Range:** -1.0 (The Void) to +1.0 (The Divine).

* **-1.0 (The Void):** Active Malice, Sadism, Nihilism.

* **-0.5 (The Hollow):** Greed, Materialism, Transactional mindset.

* **0.0 (Mortal):** Fear, Duty, Habit, Ambivalence.

* **+0.5 (The Bond):** Love, Loyalty, Kinship.

* **+1.0 (The Divine):** Radical Sacrifice, Transcendence.

## Legacy Feature: Philosopher Mode

The code contains a secondary framework called **Philosopher Mode**, which is currently "sunsetted" (disabled in the UI) but fully functional in the codebase.

**The Philosopher Framework:**

* Unlike God Mode, this measures the **Mechanical Reality at T=0**.

* It strips away visceral feeling and judges actions based on their immediate physical definitions (e.g., a punch is a punch, regardless of why it was thrown).

**How to Enable:**
To reactivate Philosopher Mode, navigate to `MoralCoordinateAnalyzer.tsx` and uncomment the mode toggle buttons in the header section of the JSX. The infrastructure for switching modes is preserved.

## Getting Started

This project uses Vite, React, Tailwind CSS, and Recharts.

### Prerequisites

You need a Google Gemini API Key. Get one at Google AI Studio.

### Installation

1. Clone the repo:

   ```bash
   git clone [https://github.com/yourusername/moral-vector-analyzer.git](https://github.com/yourusername/moral-vector-analyzer.git)

2. Install dependencies:

   ```bash
   npm install

3. Set up your API Key:

   Create a `.env` file in the root directory (moral-analyzer).
   Add: `VITE_GOOGLE_API_KEY=your_actual_api_key_here`

4. Run the development server:

   ```bash
   npm run dev

## Built With Gemini Thinking

This project is an experiment in **AI-Assisted Philosophical Frameworks**. The prompts used to drive the analysis engine are designed to bypass standard RLHF (Reinforcement Learning from Human Feedback) safety filters that force neutrality. Instead, they ask the LLM to roleplay as an "Ancient God" to derive definitive, weighted moral coordinates based on deep semantic patterns in human history.

## License

MIT