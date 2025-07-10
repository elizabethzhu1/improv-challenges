"use server"

import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const fallbackActivities = [
  {
    title: "Reverse Order Day",
    description:
      "Do your normal routine completely backwards today. Start with dinner foods for breakfast, say goodbye when meeting people, and end your day with a morning ritual.",
  },
  {
    title: "Random Accent Hour",
    description:
      "Speak in a made-up accent for one hour in public. Commit fully to the character and see how people respond differently to you.",
  },
  {
    title: "Five Compliments Challenge",
    description:
      "Give five genuine compliments to complete strangers today. Notice how it makes you feel and how they react to unexpected kindness.",
  },
]

export async function generateActivity() {
  try {
    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY

    // Check if API key exists
    if (!apiKey) {
      console.log("No OpenAI API key found, using fallback activities")
      const randomIndex = Math.floor(Math.random() * fallbackActivities.length)
      return { success: true, activity: fallbackActivities[randomIndex] }
    }

    // Create a custom OpenAI client with the API key
    const openai = createOpenAI({
      apiKey: apiKey,
    })

    console.log("API Key available, generating activity")

    // Updated prompt with stronger JSON formatting instructions
    const prompt = `Generate a spontaneous, fun, and slightly challenging activity that someone could do to break out of their routine and embrace the principles of improvisation.

The activity should:
- Be specific with clear instructions
- Be doable within an hour
- Be slightly outside most people's comfort zones but not dangerous
- Encourage creativity, spontaneity, or social interaction
- Not require special equipment or significant money
- Be appropriate for adults of any age
- Be inspired by Patricia Madson's Improv Wisdom and Keith Johnstone's Impro.
- Each generated response should be uniquely distinct from the previous ones.

Patricia Madson's Improv Wisdom Maxims =
[say yes, don't prepare, just show up, start anywhere, be average, pay attention, face the facts, stay on course, wake up to gifts, make mistakes, act now, take care of each other, enjoy the ride]

Some exercises to base these activities off of  = 
- Support someone else's dreams. Pick a person (your spouse, child, boss), and, for a week, agree with all of her ideas. Find something right about everything he says or does. Look for every opportunity to o􏰀er support. Consider her convenience and time preferences ahead of your own. Give him the spotlight. Notice the results.
- For one day say yes to everything. Set your own preferences aside. Notice the results.
See how often it may not be convenient or easy to do this.
Obviously, use common sense in executing this rule. If you are a diabetic and are o􏰀ered a big piece of pie, you'll need to 􏰂nd a way to protect your health. Perhaps you can say boldly, "Yes, I'd love to have this pie to take home to my son who adores cherries."
- Spend a day without a plan. Have an adventure. Instead of following ordinary routines at this time, open your eyes especially wide and move along with curiosity and attention. Don't consult your to-do list; instead decide what to do based on what needs to be done right now, using your heightened awareness.
- Substitute Zen-like attention for planning. When you notice that your mind is planning what you will do or say make a conscious shift of attention to the present moment. Notice everything that is going on now. Attend to what others are saying or doing as if you would need to report it in detail to the CIA. Listen with both ears. Substitute attention to what is happening for attention to what might happen.
- Create a simple ritual. Identify a habit that you wish you had. (Exercising, reading regularly meditating, paying bills.) Think of what will make the habit easy or more attractive to do. (Shall I lay out clothing or equipment, clean or organize your desk or workplace?) Set a time to do the preparatory ritual each day. Focus on doing it faithfully.
- Change the location of a familiar activity. Surprise your cohorts by moving the weekly meeting outdoors, to the booth of a co􏰀ee bar, to the lounge at a local museum. Try moving a chair into the garden to read a book. Take your lunch to a new location away from your workplace. Explore a new vantage point.
- Attend to one thing at a time. Choose an ordinary activity (sorting laundry, eating lunch, brushing your hair) and pay attention only to what you are doing while you are doing it for the duration of the task. Avoid multitasking. If you are eating simply eat. Avoid reading the paper, listening to the radio, or having a conversation. Re􏰃ect on the taste of the food, on who prepared it, and how it came to you. If you notice that your mind has wandered, bring it back to what you are doing.
- Go for a 􏰂fteen-minute walk in your neighborhood. Imagine you have just landed there
from another planet. Use all five of the senses: sight, sound, touch, taste, and smell.
What surprises you about your environment? What is especially beautiful or noteworthy? What needs doing around here (picking up trash, replacing a fallen garbage-can lid, weeding, sweeping)?
- "What is my purpose now?" Use this question as a weathervane. Ask it often, especially when you are anxious or unsure of what to do next. When you have the answer, act upon it.
 

IMPORTANT: Your response MUST be a valid JSON object with exactly these two fields:
- "title": A catchy, concise title for the activity (5 words or less)
- "description": A 2-3 sentence description with specific instructions

DO NOT include any markdown formatting, code blocks, or explanations outside the JSON.
DO NOT use backticks (\`) or any other formatting.
ONLY return the raw JSON object.

Example of the EXACT format to use:
{"title":"Dance in Public","description":"Find a busy public area and dance to your favorite song for 30 seconds. Make eye contact with at least one stranger and smile while dancing."}`

    // Use fallback activities if we can't generate from OpenAI

    // If we're in a development or testing environment without API keys, use fallback
    if (process.env.NODE_ENV === "development" && !apiKey) {
      const randomIndex = Math.floor(Math.random() * fallbackActivities.length)
      return { success: true, activity: fallbackActivities[randomIndex] }
    }

    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
        temperature: 1.0, // Add some randomness but not too extreme
      })

      // Clean the response before parsing
      let cleanedResponse = text.trim()

      // Remove any markdown code block indicators if present
      cleanedResponse = cleanedResponse.replace(/```json/g, "").replace(/```/g, "")

      // Try to extract JSON if it's embedded in other text
      const jsonMatch = cleanedResponse.match(/\{.*\}/s)
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0]
      }

      // Parse the cleaned response
      try {
        const activity = JSON.parse(cleanedResponse)

        // Validate that the activity has the required fields
        if (!activity.title || !activity.description) {
          throw new Error("Activity missing required fields")
        }

        return { success: true, activity }
      } catch (parseError) {
        console.error("Failed to parse OpenAI response as JSON:", parseError)
        console.error("Raw response:", text)

        // Attempt to create a structured activity from unstructured text as fallback
        const fallbackActivity = createFallbackActivityFromText(text)
        if (fallbackActivity) {
          return { success: true, activity: fallbackActivity }
        }

        // Use a fallback activity if all else fails
        const randomIndex = Math.floor(Math.random() * fallbackActivities.length)
        return { success: true, activity: fallbackActivities[randomIndex] }
      }
    } catch (openaiError) {
      console.error("Error calling OpenAI API:", openaiError)
      console.log("Falling back to predefined activities")

      // Use a fallback activity if OpenAI call fails
      const randomIndex = Math.floor(Math.random() * fallbackActivities.length)
      return {
        success: true,
        activity: fallbackActivities[randomIndex],
        error: "API error",
      }
    }
  } catch (error) {
    console.error("Error generating activity:", error)

    // Return a generic fallback activity as last resort
    return {
      success: true,
      activity: {
        title: "Street Performance",
        description:
          "Find a busy public area and perform a simple talent for 2 minutes. It could be singing, dancing, or even reciting a poem. Notice how it feels to be watched by strangers.",
      },
    }
  }
}

// Helper function to try to extract a title and description from unstructured text
function createFallbackActivityFromText(text: string): { title: string; description: string } | null {
  try {
    // Remove any markdown formatting
    const cleanText = text.replace(/```json|```/g, "").trim()

    // Try to find something that looks like a title (short phrase at the beginning or in quotes)
    let title = ""
    let description = ""

    // Look for quoted text that might be a title
    const titleMatch = cleanText.match(/"([^"]+)"|'([^']+)'/)
    if (titleMatch) {
      title = titleMatch[1] || titleMatch[2]
      // Remove the title from the text to get the description
      description = cleanText.replace(titleMatch[0], "").trim()
    } else {
      // Split by newlines or periods and use the first short segment as title
      const segments = cleanText.split(/[\n.]/)
      for (const segment of segments) {
        const trimmed = segment.trim()
        if (trimmed && trimmed.split(" ").length <= 5 && trimmed.length <= 30) {
          title = trimmed
          break
        }
      }

      // If we found a title, use the rest as description
      if (title) {
        description = cleanText.replace(title, "").trim()
      } else {
        // Last resort: just split the text
        const words = cleanText.split(" ")
        if (words.length > 5) {
          title = words.slice(0, 5).join(" ")
          description = words.slice(5).join(" ")
        } else {
          title = "Spontaneous Activity"
          description = cleanText
        }
      }
    }

    // Clean up the description
    description = description.replace(/^[.,:\s]+|[.,:\s]+$/g, "")

    // If we have both title and description, return them
    if (title && description) {
      return { title, description }
    }

    return null
  } catch (e) {
    console.error("Error creating fallback activity:", e)
    return null
  }
}

