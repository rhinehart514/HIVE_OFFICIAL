'use client';

/**
 * HiveLab Context Selection Page
 *
 * Per DRAMA plan Phase 4.2:
 * 1. Title: WordReveal "Where will this tool live?"
 * 2. Cards: Stagger entrance (200ms between)
 * 3. Card hover: Scale 1.03 + gold border draws in
 * 4. Selection: Card pulses gold, others fade, transition to create
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  WordReveal,
} from '@hive/ui';
import { MOTION } from '@hive/ui/tokens/motion';
import { apiClient } from '@/lib/api-client';
import {
  UserCircleIcon,
  BuildingOffice2Icon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const UserCircle = UserCircleIcon;
const Building = BuildingOffice2Icon;
const Sparkles = SparklesIcon;

const EASE = MOTION.ease.premium;

type Space = {
  id: string;
  name: string;
  description?: string;
  role?: string;
  memberCount?: number;
};

// Context option card with hover and selection effects
interface ContextCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  subtext?: string;
  buttonText: string;
  index: number;
  isSelected: boolean;
  otherSelected: boolean;
  onClick: () => void;
}

function ContextCard({
  icon,
  title,
  description,
  subtext,
  buttonText,
  index,
  isSelected,
  otherSelected,
  onClick,
}: ContextCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: otherSelected ? 0.3 : 1,
        y: 0,
        scale: isSelected ? 1.02 : 1,
      }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        delay: shouldReduceMotion ? 0 : index * 0.2, // 200ms stagger
        ease: EASE,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          scale: isHovered && !isSelected ? 1.03 : 1,
          boxShadow: isSelected
            ? '0 0 0 2px rgba(212, 175, 55, 0.8), 0 8px 32px rgba(212, 175, 55, 0.2)'
            : isHovered
              ? '0 0 0 1px rgba(212, 175, 55, 0.4), 0 4px 16px rgba(212, 175, 55, 0.1)'
              : '0 0 0 0 rgba(212, 175, 55, 0)',
        }}
        transition={{
          duration: MOTION.duration.fast,
          ease: EASE,
        }}
        className="rounded-xl"
      >
        <Card
          className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)] transition-colors cursor-pointer"
          style={{
            borderColor: isSelected || isHovered ? 'rgba(212, 175, 55, 0.4)' : undefined,
          }}
          onClick={onClick}
        >
          <CardHeader className="pb-4">
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
                backgroundColor: isHovered
                  ? 'rgba(212, 175, 55, 0.2)'
                  : 'rgba(212, 175, 55, 0.1)',
              }}
              transition={{ duration: 0.2 }}
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            >
              {icon}
            </motion.div>
            <CardTitle className="text-xl text-[var(--hive-text-primary)] truncate">
              {title}
            </CardTitle>
            <CardDescription className="text-[var(--hive-text-secondary)] line-clamp-2">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subtext && (
                <p className="text-sm text-[var(--hive-text-tertiary)]">
                  {subtext}
                </p>
              )}
              <Button
                className="w-full bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                {buttonText}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Selection pulse effect */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              border: '2px solid rgba(212, 175, 55, 0.6)',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SelectContextPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const returnUrl = searchParams.get('return');

  // If context is already provided (e.g., from space page), skip selection
  const preselectedContext = searchParams.get('context');
  const preselectedSpaceId = searchParams.get('spaceId');
  const preselectedSpaceName = searchParams.get('spaceName');

  const [isClient, setIsClient] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titleRevealed, setTitleRevealed] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-redirect if context is pre-selected
  useEffect(() => {
    if (!isClient) return;

    if (preselectedContext === 'space' && preselectedSpaceId && preselectedSpaceName) {
      // Skip selection, go straight to create
      const params = new URLSearchParams({
        context: 'space',
        spaceId: preselectedSpaceId,
        spaceName: preselectedSpaceName,
      });
      if (returnUrl) params.set('return', returnUrl);
      router.replace(`/create?${params.toString()}`);
    } else if (preselectedContext === 'profile') {
      // Skip selection, go straight to create
      const params = new URLSearchParams({
        context: 'profile',
      });
      if (returnUrl) params.set('return', returnUrl);
      router.replace(`/create?${params.toString()}`);
    }
  }, [isClient, preselectedContext, preselectedSpaceId, preselectedSpaceName, returnUrl, router]);

  // Fetch user and their leadable spaces
  useEffect(() => {
    if (!isClient) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch spaces where user can deploy (leader/admin/builder roles)
        const spacesResponse = await apiClient.get('/api/profile/my-spaces');
        if (spacesResponse.ok) {
          const spacesData = await spacesResponse.json();
          const allSpaces = (spacesData.spaces || spacesData || []) as Space[];

          // Filter to spaces where user can deploy tools
          const leadSpaces = allSpaces.filter(
            (s) => s.role === 'leader' || s.role === 'admin' || s.role === 'builder'
          );

          setSpaces(leadSpaces);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isClient]);

  const handleSelectProfile = useCallback(() => {
    if (isTransitioning) return;

    setSelectedContext('profile');
    setIsTransitioning(true);

    // Wait for selection animation then navigate
    setTimeout(() => {
      const params = new URLSearchParams({
        context: 'profile',
      });
      if (returnUrl) params.set('return', returnUrl);
      router.push(`/create?${params.toString()}`);
    }, shouldReduceMotion ? 0 : 400);
  }, [isTransitioning, returnUrl, router, shouldReduceMotion]);

  const handleSelectSpace = useCallback((spaceId: string, spaceName: string) => {
    if (isTransitioning) return;

    setSelectedContext(`space-${spaceId}`);
    setIsTransitioning(true);

    // Wait for selection animation then navigate
    setTimeout(() => {
      const params = new URLSearchParams({
        context: 'space',
        spaceId,
        spaceName,
      });
      if (returnUrl) params.set('return', returnUrl);
      router.push(`/create?${params.toString()}`);
    }, shouldReduceMotion ? 0 : 400);
  }, [isTransitioning, returnUrl, router, shouldReduceMotion]);

  if (!isClient || isLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-3">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Skeleton className="h-48 w-full rounded-xl" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <p className="text-[var(--hive-status-error)]">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-[var(--hive-brand-primary)] hover:underline"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // Build the list of context options
  const contextOptions: Array<{
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    subtext?: string;
    buttonText: string;
    onClick: () => void;
  }> = [
    {
      id: 'profile',
      icon: <UserCircle className="w-6 h-6 text-[var(--hive-brand-primary)]" />,
      title: 'Personal Profile',
      description: 'Build a tool for your own profile page',
      subtext: 'Create tools that appear on your profile and showcase your work to the campus community.',
      buttonText: 'Build for Profile',
      onClick: handleSelectProfile,
    },
    ...spaces.slice(0, 3).map((space) => ({
      id: `space-${space.id}`,
      icon: <Building className="w-6 h-6 text-[var(--hive-brand-primary)]" />,
      title: space.name,
      description: space.description || 'Build a tool for this space',
      subtext: space.memberCount ? `${space.memberCount} members` : undefined,
      buttonText: `Build for ${space.name}`,
      onClick: () => handleSelectSpace(space.id, space.name),
    })),
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header with WordReveal */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
            }}
            className="inline-flex items-center justify-center w-16 h-16 bg-[var(--hive-brand-primary)]/10 rounded-2xl mb-4"
          >
            <Sparkles className="w-8 h-8 text-[var(--hive-brand-primary)]" />
          </motion.div>

          <div className="text-3xl font-bold text-[var(--hive-text-primary)]">
            <WordReveal
              text="Where will this tool live?"
              stagger={0.06}
              onComplete={() => setTitleRevealed(true)}
            />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={titleRevealed ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: shouldReduceMotion ? 0 : MOTION.duration.base,
              delay: shouldReduceMotion ? 0 : 0.2,
              ease: EASE,
            }}
            className="text-[var(--hive-text-secondary)] max-w-2xl mx-auto"
          >
            Choose whether you're building a tool for your personal profile or for a space you lead.
          </motion.p>
        </div>

        {/* Context Options with stagger */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contextOptions.map((option, index) => (
            <ContextCard
              key={option.id}
              icon={option.icon}
              title={option.title}
              description={option.description}
              subtext={option.subtext}
              buttonText={option.buttonText}
              index={index}
              isSelected={selectedContext === option.id}
              otherSelected={selectedContext !== null && selectedContext !== option.id}
              onClick={option.onClick}
            />
          ))}

          {/* No spaces available */}
          {spaces.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : MOTION.duration.base,
                delay: shouldReduceMotion ? 0 : 0.2,
                ease: EASE,
              }}
            >
              <Card className="bg-[var(--hive-background-secondary)] border-dashed border-2 border-[var(--hive-border-default)]">
                <CardContent className="py-12 text-center">
                  <Building className="w-12 h-12 text-[var(--hive-text-tertiary)] mx-auto mb-4" />
                  <h3 className="font-semibold text-[var(--hive-text-primary)] mb-2">
                    No Spaces Available
                  </h3>
                  <p className="text-sm text-[var(--hive-text-secondary)] mb-4">
                    You need to be a leader, admin, or builder in a space to create tools for it.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000', '_blank')}
                  >
                    Browse Spaces
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Show more spaces if available */}
          {spaces.length > 3 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : MOTION.duration.base,
                delay: shouldReduceMotion ? 0 : 0.8,
                ease: EASE,
              }}
            >
              <Card className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-[var(--hive-text-secondary)] mb-4">
                    +{spaces.length - 3} more space{spaces.length - 3 !== 1 ? 's' : ''} available
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (spaces[3]) {
                        handleSelectSpace(spaces[3].id, spaces[3].name);
                      }
                    }}
                  >
                    View All Spaces
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Hint text - fade in at 800ms */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.base,
            delay: shouldReduceMotion ? 0 : 0.8,
            ease: EASE,
          }}
          className="text-center text-sm text-[var(--hive-text-tertiary)]"
        >
          You can deploy anywhere later
        </motion.p>

        {/* Feed Preview (Coming Soon) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.base,
            delay: shouldReduceMotion ? 0 : 1,
            ease: EASE,
          }}
          className="pt-8 border-t border-[var(--hive-border-default)]"
        >
          <Card className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)] opacity-60">
            <CardContent className="py-8 text-center">
              <Sparkles className="w-10 h-10 text-[var(--hive-text-tertiary)] mx-auto mb-3" />
              <h3 className="font-semibold text-[var(--hive-text-primary)] mb-2">
                Feed Tools Coming Soon
              </h3>
              <p className="text-sm text-[var(--hive-text-secondary)]">
                Soon you'll be able to build tools that appear in the campus feed
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
