import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw, AlertTriangle, Wrench, Cog } from "lucide-react";
import { Link } from "wouter";

export default function ServerError() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${5 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [0, -15, 0],
              rotate: i % 2 === 0 ? [0, 360] : [360, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            {i % 3 === 0 && <Cog className="w-12 h-12 text-orange-300/30" />}
            {i % 3 === 1 && <Wrench className="w-10 h-10 text-red-300/30" />}
            {i % 3 === 2 && <AlertTriangle className="w-8 h-8 text-yellow-400/30" />}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-lg mx-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mb-8"
        >
          <svg viewBox="0 0 400 300" className="w-full max-w-md mx-auto">
            <motion.ellipse
              cx="200"
              cy="270"
              rx="140"
              ry="20"
              fill="currentColor"
              className="text-gray-200 dark:text-gray-700"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 }}
            />
            
            <motion.g
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <rect x="120" y="60" width="160" height="200" rx="8" fill="currentColor" className="text-gray-600 dark:text-gray-500" />
              <rect x="130" y="70" width="60" height="8" rx="2" fill="currentColor" className="text-green-400" />
              <rect x="130" y="85" width="40" height="8" rx="2" fill="currentColor" className="text-blue-400" />
              <rect x="130" y="100" width="50" height="8" rx="2" fill="currentColor" className="text-yellow-400" />
              
              {[...Array(6)].map((_, i) => (
                <motion.circle
                  key={i}
                  cx={145 + (i % 3) * 20}
                  cy={130 + Math.floor(i / 3) * 20}
                  r="5"
                  fill="currentColor"
                  className={i === 2 ? "text-red-500" : "text-green-400"}
                  animate={i === 2 ? { opacity: [1, 0.3, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              ))}
              
              {[...Array(4)].map((_, i) => (
                <rect
                  key={i}
                  x="220"
                  y={75 + i * 15}
                  width="50"
                  height="8"
                  rx="2"
                  fill="currentColor"
                  className="text-gray-400"
                />
              ))}
            </motion.g>

            <motion.g
              animate={{ 
                rotate: [0, 5, -5, 0],
                y: [0, -3, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ transformOrigin: "320px 150px" }}
            >
              <circle cx="320" cy="150" r="35" fill="currentColor" className="text-orange-400" />
              <Wrench className="text-white" style={{ transform: "translate(297px, 127px)" }} width={46} height={46} />
            </motion.g>

            <motion.g
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <rect x="60" y="120" width="40" height="100" rx="5" fill="currentColor" className="text-red-500" />
              <text x="80" y="175" textAnchor="middle" fill="white" style={{ fontSize: "24px", fontWeight: "bold" }}>!</text>
              <motion.path
                d="M 100 140 L 120 140"
                stroke="currentColor"
                strokeWidth="3"
                className="text-red-400"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.g>

            <motion.text
              x="200"
              y="240"
              textAnchor="middle"
              className="fill-destructive font-bold"
              style={{ fontSize: "36px" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              500
            </motion.text>

            {[...Array(5)].map((_, i) => (
              <motion.circle
                key={i}
                cx={150 + i * 25}
                cy={50}
                r={3}
                fill="currentColor"
                className="text-yellow-400"
                animate={{ 
                  y: [0, 10, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Server Taking a Quick Break!
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Our servers are working hard but hit a small bump. 
            Don't worry, our team is on it! Please try again in a moment.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRefresh} size="lg" className="gap-2" data-testid="button-refresh">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2" data-testid="button-home">
              <Link href="/">
                <Home className="w-4 h-4" />
                Go to Homepage
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 p-4 bg-card rounded-lg border"
        >
          <p className="text-sm text-muted-foreground mb-2">
            If this keeps happening, please contact us:
          </p>
          <a 
            href="mailto:support@samikaranolympiad.com" 
            className="text-primary hover:underline font-medium"
          >
            support@samikaranolympiad.com
          </a>
        </motion.div>
      </div>
    </div>
  );
}
