import type { Coach } from "@/lib/coaches";
import type { Sponsor } from "@/lib/sponsors";
import type { TeamMember } from "@/lib/team-members";
import type { GalleryPhoto } from "@/lib/gallery-photos";
import { demoAssets } from "@/lib/demo/demo-assets";

const GENERIC_COACH_BIO =
  "Guides the team through Robot Design & Code, the Innovation Project, and Core Values—helping every practice stay focused, kind, and ambitious.";

const GENERIC_MEMBER_BIO =
  "Builds, codes, and contributes ideas during practice—learning Robot Game missions, the Innovation Project, and Core Values with the team.";

export const DEMO_COACHES: Coach[] = [
  {
    id: "coach-alex-morgan",
    name: "Alex Morgan",
    photoUrl: demoAssets.coachAlex,
    description: GENERIC_COACH_BIO,
    sortOrder: 0,
  },
  {
    id: "coach-jordan-lee",
    name: "Jordan Lee",
    photoUrl: demoAssets.coachJordan,
    description: GENERIC_COACH_BIO,
    sortOrder: 1,
  },
];

export const DEMO_TEAM_MEMBERS: TeamMember[] = [
  { id: "member-sam", name: "Sam Chen", photoUrl: demoAssets.memberSam, description: GENERIC_MEMBER_BIO, sortOrder: 0 },
  { id: "member-riley", name: "Riley Patel", photoUrl: demoAssets.memberRiley, description: GENERIC_MEMBER_BIO, sortOrder: 1 },
  { id: "member-casey", name: "Casey Nguyen", photoUrl: demoAssets.memberCasey, description: GENERIC_MEMBER_BIO, sortOrder: 2 },
  { id: "member-morgan", name: "Morgan Brooks", photoUrl: demoAssets.memberMorgan, description: GENERIC_MEMBER_BIO, sortOrder: 3 },
  { id: "member-jordan", name: "Jordan Kim", photoUrl: demoAssets.memberJordan, description: GENERIC_MEMBER_BIO, sortOrder: 4 },
  { id: "member-taylor", name: "Taylor Wright", photoUrl: demoAssets.memberTaylor, description: GENERIC_MEMBER_BIO, sortOrder: 5 },
];

export const DEMO_SPONSORS: Sponsor[] = [
  {
    id: "sponsor-community-bank",
    name: "Community Bank",
    logoUrl: demoAssets.sponsorBank,
    description: "Supporting youth STEM programs in our county.",
    sortOrder: 0,
  },
  {
    id: "sponsor-tech-partners",
    name: "Tech Partners LLC",
    logoUrl: demoAssets.sponsorTech,
    description: "Local technology mentors and workshop space.",
    sortOrder: 1,
  },
  {
    id: "sponsor-youth-foundation",
    name: "Youth Foundation",
    logoUrl: demoAssets.sponsorTech,
    description: "Grants for robotics and after-school STEM.",
    sortOrder: 2,
  },
];

export const DEMO_GALLERY_PHOTOS: GalleryPhoto[] = [
  { src: demoAssets.galleryRobot, thumb: demoAssets.galleryRobot, width: 1600, height: 1200 },
  { src: demoAssets.galleryBuild, thumb: demoAssets.galleryBuild, width: 1600, height: 1200 },
  { src: demoAssets.galleryCompetition, thumb: demoAssets.galleryCompetition, width: 1600, height: 1200 },
  { src: demoAssets.galleryPractice, thumb: demoAssets.galleryPractice, width: 1600, height: 1200 },
  { src: demoAssets.galleryPresentation, thumb: demoAssets.galleryPresentation, width: 1600, height: 1200 },
  { src: demoAssets.galleryAward, thumb: demoAssets.galleryAward, width: 1600, height: 1200 },
  { src: demoAssets.galleryRobotCloseup, thumb: demoAssets.galleryRobotCloseup, width: 1600, height: 1200 },
  { src: demoAssets.galleryOutreachBooth, thumb: demoAssets.galleryOutreachBooth, width: 1600, height: 1200 },
  { src: demoAssets.galleryCoreValues, thumb: demoAssets.galleryCoreValues, width: 1600, height: 1200 },
];
