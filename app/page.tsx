import {
  Preloader,
  Nav,
  Cursor,
  BackgroundFX,
  Chapter,
  ChapterIndicator,
  Footer,
  EasterEgg,
} from '@/components/Chrome';
import { Hero } from '@/components/Hero';
import { Intro, About, Philosophy } from '@/components/Story';
import { Skills } from '@/components/Skills';
import { Education } from '@/components/Education';
import { IdamOverview, IdamProblem, IdamAuth, IdamEngineering } from '@/components/idam/IdamCore';
import { IdamPreview } from '@/components/idam/IdamPreview';
import { IdamArchitecture } from '@/components/idam/IdamArchitecture';
import { IdamSearch, PropertyLab, EnquiryFlow, VisitScheduling } from '@/components/idam/IdamJourney';
import { Velappan } from '@/components/idam/Velappan';
import { Process } from '@/components/Process';
import {
  Certifications,
  ResumeSection,
  Exploring,
  BeyondStack,
  GithubSection,
  FutureSection,
} from '@/components/Journey';
import { Contact } from '@/components/Contact';

export default function Home() {
  return (
    <>
      <Preloader />
      <BackgroundFX />
      <Cursor />
      <Nav />

      <main className="relative z-10">
        <Hero />
        <Intro />

        <Chapter n="01" title="THE PERSON" sub="Who is behind the work." />
        <About />
        <Philosophy />

        <Chapter n="02" title="THE BUILDER" sub="Capabilities, and the ground they're built on." />
        <Skills />
        <Education />

        <Chapter n="03" title="THE PRODUCT" sub="IDAM — the flagship case study." />
        <IdamOverview />
        <IdamProblem />
        <IdamPreview />
        <IdamArchitecture />
        <IdamAuth />
        <IdamSearch />
        <PropertyLab />
        <EnquiryFlow />
        <VisitScheduling />
        <Velappan />
        <IdamEngineering />

        <Chapter n="04" title="THE PROCESS" sub="How an idea becomes an interface." />
        <Process />

        <Chapter n="05" title="THE JOURNEY" sub="Proof, ground and what's still forming." />
        <Certifications />
        <ResumeSection />
        <Exploring />
        <BeyondStack />
        <GithubSection />
        <FutureSection />

        <Chapter n="06" title="WHAT'S NEXT" sub="The next idea hasn't shipped yet. Talk about it." />
        <Contact />
      </main>

      <Footer />
      <ChapterIndicator />
      <EasterEgg />
    </>
  );
}
