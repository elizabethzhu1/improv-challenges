"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, RefreshCw, Copy, Check, Plus, Minus, User, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { generateActivity } from "./actions"
import { useToast } from "@/hooks/use-toast"

// Fallback activities in case the API fails
const fallbackActivities = [
  {
    title: "High Five a Stranger",
    description:
      "Find a friendly-looking stranger in a public place and offer them a high five. Smile and say 'Happy Tuesday!' (or whatever day it is).",
  },
  {
    title: "Explore a New Building",
    description:
      "Walk into a building you've never been in before. It could be a hotel lobby, a university building, or an office tower. Spend 10 minutes exploring and notice three interesting details.",
  },
  {
    title: "Random Bus Adventure",
    description:
      "Get on the next bus that arrives at your nearest stop. Ride for 3 stops, get off, and find something interesting in that neighborhood.",
  },
  {
    title: "Compliment Chain",
    description:
      "Give genuine compliments to three strangers in a row. Notice how it makes you feel and how they react.",
  },
  {
    title: "Reverse Shopping",
    description:
      "Go to a store and ask an employee to recommend their favorite item under $10. Buy it without questioning their choice.",
  },
]

type GameMode = "solo" | "multiplayer"

interface Activity {
  title: string
  description: string
}

export default function Home() {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isCopied, setIsCopied] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>("solo")
  const [playerCount, setPlayerCount] = useState(2)
  const { toast } = useToast()

  const handleGenerateActivity = async () => {
    setIsGenerating(true)

    try {
      const result = await generateActivity()

      if (result.success && result.activity) {
        // If in multiplayer mode, modify the description to include player count
        if (gameMode === "multiplayer" && playerCount > 1) {
          const activity = result.activity

          // Only modify if it doesn't already mention multiple people
          if (
            !activity.description.toLowerCase().includes("people") &&
            !activity.description.toLowerCase().includes("friends") &&
            !activity.description.toLowerCase().includes("partners") &&
            !activity.description.toLowerCase().includes("together")
          ) {
            activity.description = `With ${playerCount} people: ${activity.description}`
          }

          setActivity(activity)
        } else {
          setActivity(result.activity)
        }

        setRetryCount(0) // Reset retry count on success
      } else {
        // If we've already retried once, use a fallback
        if (retryCount > 0) {
          const randomIndex = Math.floor(Math.random() * fallbackActivities.length)
          let activity = fallbackActivities[randomIndex]

          // If in multiplayer mode, modify the description
          if (gameMode === "multiplayer" && playerCount > 1) {
            // Only modify if it doesn't already mention multiple people
            if (
              !activity.description.toLowerCase().includes("people") &&
              !activity.description.toLowerCase().includes("friends") &&
              !activity.description.toLowerCase().includes("partners") &&
              !activity.description.toLowerCase().includes("together")
            ) {
              activity = {
                ...activity,
                description: `With ${playerCount} people: ${activity.description}`,
              }
            }
          }

          setActivity(activity)

          toast({
            title: "Using fallback activity",
            description:
              "We couldn't generate a new activity after multiple attempts. Here's one from our collection instead.",
            variant: "destructive",
          })
          setRetryCount(0) // Reset retry count
        } else {
          // First failure, increment retry count and try again
          setRetryCount((prev) => prev + 1)
          toast({
            title: "Trying again",
            description: "The first attempt didn't work. Trying one more time...",
            variant: "default",
          })
          // Retry immediately
          handleGenerateActivity()
          return // Exit early to prevent setting isGenerating to false
        }
      }
    } catch (error) {
      console.error("Failed to generate activity:", error)
      // Use a fallback activity
      const randomIndex = Math.floor(Math.random() * fallbackActivities.length)
      let activity = fallbackActivities[randomIndex]

      // If in multiplayer mode, modify the description
      if (gameMode === "multiplayer" && playerCount > 1) {
        // Only modify if it doesn't already mention multiple people
        if (
          !activity.description.toLowerCase().includes("people") &&
          !activity.description.toLowerCase().includes("friends") &&
          !activity.description.toLowerCase().includes("partners") &&
          !activity.description.toLowerCase().includes("together")
        ) {
          activity = {
            ...activity,
            description: `With ${playerCount} people: ${activity.description}`,
          }
        }
      }

      setActivity(activity)

      toast({
        title: "Something went wrong",
        description: "Couldn't generate a new activity. Using one from our collection instead.",
        variant: "destructive",
      })
      setRetryCount(0) // Reset retry count
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyToClipboard = async () => {
    if (!activity) return

    const shareText = `Try this spontaneous activity: "${activity.title}" - ${activity.description}`

    try {
      await navigator.clipboard.writeText(shareText)
      setIsCopied(true)
      toast({
        title: "Copied to clipboard!",
        description: "Now you can paste and send to your friends.",
      })

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Couldn't copy to clipboard",
        description: "Try selecting and copying the text manually.",
        variant: "destructive",
      })
    }
  }

  const incrementPlayerCount = () => {
    setPlayerCount((prev) => Math.min(prev + 1, 10))
  }

  const decrementPlayerCount = () => {
    setPlayerCount((prev) => Math.max(prev - 1, 2))
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-xl w-full space-y-8 px-2 mx-auto">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl md:text-5xl whitespace-nowrap">
            Spontaneous Adventures
          </h1>
          <p className="mt-3 text-xl text-gray-500 dark:text-gray-400">
            Improvisational challenges to break your routine.
          </p>
        </div>

        {/* Game Mode Selection */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={gameMode === "solo" ? "default" : "outline"}
              className={`flex items-center gap-2 ${gameMode === "solo" ? "bg-black text-white hover:bg-gray-800" : "border-black text-black hover:bg-gray-100"}`}
              onClick={() => setGameMode("solo")}
            >
              <User className="h-4 w-4" />
              Solo
            </Button>
            <Button
              variant={gameMode === "multiplayer" ? "default" : "outline"}
              className={`flex items-center gap-2 ${gameMode === "multiplayer" ? "bg-black text-white hover:bg-gray-800" : "border-black text-black hover:bg-gray-100"}`}
              onClick={() => setGameMode("multiplayer")}
            >
              <Users className="h-4 w-4" />
              Multiplayer
            </Button>
          </div>

          {/* Player Count Selection (only visible in multiplayer mode) */}
          {gameMode === "multiplayer" && (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={decrementPlayerCount}
                disabled={playerCount <= 2}
              >
                <Minus className="h-3 w-3" />
                <span className="sr-only">Decrease</span>
              </Button>
              <span className="w-8 text-center font-medium">{playerCount}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={incrementPlayerCount}
                disabled={playerCount >= 10}
              >
                <Plus className="h-3 w-3" />
                <span className="sr-only">Increase</span>
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">players</span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activity && (
            <motion.div
              key={activity.title + (gameMode === "multiplayer" ? playerCount : "solo")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-blue-200 dark:border-green-900">
                <CardHeader>
                  <CardTitle className="text-2xl text-center text-blue-700 dark:text-green-500">
                    {activity.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                    {activity.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center w-full">
                    You've got to jump off the cliff all the time and build your wings on the way down. - Ray Bradbury
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 mx-auto transition-all"
                    onClick={handleCopyToClipboard}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy to challenge a friend
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleGenerateActivity}
            disabled={isGenerating}
            className="bg-gradient-to-r from-teal-400 to-yellow-200 via-pink-500 via-red-500 via-yellow-500 via-green-500 via-blue-500 to-indigo-600 text-white px-8 py-6 text-xl rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 hover:opacity-90 hover:border-solid hover:border-black border-none"
          >
            {isGenerating ? (
              <span className="flex items-center">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </span>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                I'm Feeling Lucky
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  )
}

