import os
import json
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

def clean_tag(s: str) -> str:
    return "".join([c for c in s if c.isalnum()])

class PostGenerationService:
    def generate_post_variations(
        self,
        verified_data: Dict[str, Any],
        achievement_type: str,
        extra_responses: Dict[str, Any] = None,
        preferred_tone: str = "Professional",
        custom_instructions: str = None
    ) -> List[Dict[str, Any]]:
        """
        Generate 3 comprehensive, high-reach LinkedIn post variations:
        Option 1: In-Depth Technical & Professional Breakdown
        Option 2: High-Engagement Story & Builder Journey
        Option 3: Punchy, High-Impact Executive Summary
        """
        if settings.AI_API_KEY and not settings.AI_API_KEY.startswith(("mock_", "YOUR_")):
            try:
                llm_posts = self._generate_with_llm(
                    verified_data, achievement_type, extra_responses, preferred_tone, custom_instructions
                )
                if llm_posts and len(llm_posts) == 3:
                    return llm_posts
            except Exception as e:
                logger.warning(f"LLM post generation fallback to template generator: {str(e)}")

        return self._template_generation(
            verified_data, achievement_type, extra_responses, preferred_tone, custom_instructions
        )

    def _generate_with_llm(
        self,
        data: Dict[str, Any],
        achievement_type: str,
        extra_responses: Dict[str, Any] = None,
        preferred_tone: str = "Professional",
        custom_instructions: str = None
    ) -> Optional[List[Dict[str, Any]]]:
        import httpx

        prompt = (
            f"You are a top-tier LinkedIn tech content strategist and ghostwriter for elite software engineers and researchers.\n"
            f"Write 3 comprehensive, high-reach LinkedIn post variations celebrating this achievement.\n"
            f"EACH POST MUST BE THOROUGH, MULTI-PARAGRAPH, DEEPLY TECHNICAL, AND HIGHLY ENGAGING (NOT SHORT/BRIEF).\n\n"
            f"ACHIEVEMENT METADATA:\n"
            f"- Recipient Name: {data.get('recipient_name', '')}\n"
            f"- Title: {data.get('achievement_title', '')}\n"
            f"- Organization: {data.get('issuing_organization', '')}\n"
            f"- Type: {achievement_type}\n"
            f"- Skills: {', '.join(data.get('skills', []))}\n"
            f"- Context: {json.dumps(extra_responses or {})}\n"
            f"- Preferred Tone: {preferred_tone}\n"
            f"- Custom Notes: {custom_instructions or 'None'}\n\n"
            f"FORMATTING REQUIREMENTS:\n"
            f"- Include a compelling opening hook.\n"
            f"- Include bullet points covering technical architecture, algorithms, implementation challenges, or takeaways.\n"
            f"- Include a grateful acknowledgement of the organizers.\n"
            f"- Include an engaging closing question to drive comments & discussion.\n"
            f"- Include 8 to 12 relevant, high-reach hashtags in each variation.\n\n"
            f"Return a JSON object with key 'variations' containing 3 items:\n"
            f"1. option_id: 1, title: 'In-Depth Technical & Architecture Breakdown', tone: 'Professional', caption: '...', hashtags: [...], suggested_skills: [...]\n"
            f"2. option_id: 2, title: 'Engaging Builder Journey & Story', tone: 'Engaging', caption: '...', hashtags: [...], suggested_skills: [...]\n"
            f"3. option_id: 3, title: 'Impactful Industry Summary & Lessons Learned', tone: 'Impactful', caption: '...', hashtags: [...], suggested_skills: [...]"
        )

        if settings.AI_PROVIDER == "openai":
            resp = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.AI_API_KEY}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"}
                },
                timeout=20.0
            )
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                if isinstance(parsed, dict) and "variations" in parsed:
                    return parsed["variations"]
                if isinstance(parsed, list):
                    return parsed
        return None

    def _template_generation(
        self,
        data: Dict[str, Any],
        achievement_type: str,
        extra_responses: Dict[str, Any] = None,
        preferred_tone: str = "Professional",
        custom_instructions: str = None
    ) -> List[Dict[str, Any]]:
        title = data.get("achievement_title") or "Achievement"
        org = data.get("issuing_organization") or "organizers"
        skills = data.get("skills", [])
        cert_id = data.get("certificate_id", "")
        recipient = data.get("recipient_name", "")

        skills_str = ", ".join(skills) if skills else "Artificial Intelligence & Machine Learning"
        skills_phrase = f"in {skills_str}" if skills_str else ""

        # Build comprehensive, reach-optimized hashtags
        tag_pool = []
        for s in skills:
            t = clean_tag(s)
            if t and f"#{t}" not in tag_pool:
                tag_pool.append(f"#{t}")

        # Core industry & high-reach tags
        domain_tags = [
            "#ArtificialIntelligence", "#MachineLearning", "#DeepLearning",
            "#DataScience", "#Python", "#SoftwareEngineering", "#TechInnovation",
            "#Developers", "#ContinuousLearning", "#CareerMilestone",
            "#Hackathon", "#BuildInPublic", "#TechCommunity"
        ]

        # Combine without duplicates
        for dt in domain_tags:
            if dt not in tag_pool:
                tag_pool.append(dt)

        extra_bullets = ""
        if extra_responses:
            lines = [f"• {k.replace('_', ' ').capitalize()}: {v}" for k, v in extra_responses.items() if v]
            if lines:
                extra_bullets = "\n\nKey Focus Areas:\n" + "\n".join(lines)

        is_hackathon = achievement_type.lower() == "hackathon" or "hackathon" in title.lower()
        is_award = achievement_type.lower() == "award" or "award" in title.lower() or "winner" in title.lower()
        is_internship = achievement_type.lower() == "internship"

        if is_hackathon:
            # Option 1: In-depth Technical & Architecture Breakdown
            post_1 = (
                f"🚀 Excited to share that I recently participated in the '{title}' organized by {org}!\n\n"
                f"Hackathons are one of the best crucibles for engineering discipline. When you have a strict deadline and ambiguous problem statements, "
                f"success boils down to clean architecture, rapid hypothesis testing, and decisive execution {skills_phrase}.\n\n"
                f"💡 Core Technical & Engineering Takeaways from this experience:\n\n"
                f"1️⃣ Architecture & Modularity: Designing decoupled, resilient pipelines that allow rapid iterations without breaking foundational logic.\n"
                f"2️⃣ Data & Model Optimization: Balancing computational efficiency and inference latency under constrained environments.\n"
                f"3️⃣ Problem-First Engineering: Focusing squarely on the user experience and core problem rather than over-engineering auxiliary components.\n"
                f"4️⃣ Cross-Functional Team Synergy: Clear communication, git workflows, and aligned vision under intense time constraints.{extra_bullets}\n\n"
                f"Big thanks and appreciation to {org} for hosting an exceptionally organized, inspiring platform for developers to push boundaries and build.\n\n"
                f"To my network: What are the biggest lessons or engineering patterns you’ve adopted from hackathons recently? Would love to hear your perspectives in the comments! 👇"
            )

            # Option 2: High-Engagement Story & Builder Journey
            post_2 = (
                f"Building under pressure reveals what software engineering is truly about. 💡\n\n"
                f"I'm thrilled to share my participation in the '{title}', hosted by {org}!\n\n"
                f"Over the course of this event, our focus was turning ambitious concepts into functional, scalable software. We spent countless hours analyzing data, "
                f"iterating through architecture choices, and refining our solution {skills_phrase}.\n\n"
                f"Here were 3 defining moments from the challenge:\n"
                f"🔹 Brainstorming the Core Pipeline: Translating real-world requirements into an efficient technical roadmap.\n"
                f"🔹 Debugging Under the Clock: Isolating edge cases and optimizing system performance when every minute counted.\n"
                f"🔹 The Final Polish: Ensuring seamless integration between our data layer, logic, and interface.{extra_bullets}\n\n"
                f"Experiences like this constantly reinforce why I love building in technology: the intersection of relentless curiosity, practical problem-solving, and continuous learning.\n\n"
                f"Grateful to {org} for orchestrating such an impactful event. On to the next challenge! 🎯\n\n"
                f"Are you working on any hackathon or side-projects currently? Let’s connect and talk tech!"
            )

            # Option 3: Impactful Industry Summary & Lessons Learned
            post_3 = (
                f"Proud to have represented and competed in '{title}' organized by {org}! 🏆✨\n\n"
                f"This event was a deep dive into practical, high-velocity engineering. Beyond the competition itself, it was an incredible benchmark for hands-on problem solving {skills_phrase}.\n\n"
                f"Key Highlights:\n"
                f"✔️ End-to-end implementation from initial ideation to functional prototype\n"
                f"✔️ Deepening domain knowledge in {skills_str or 'cutting-edge engineering stacks'}\n"
                f"✔️ Stress-testing system design and scalability in real time{extra_bullets}\n\n"
                f"A huge thank you to the organizers and mentors at {org} for fostering innovation and providing a platform that challenges developers to excel.\n\n"
                f"Continuous learning never stops. Excited to channel these practical insights into my upcoming projects and systems!"
            )

        elif is_award:
            post_1 = (
                f"🏆 Honored and grateful to have received '{title}' from {org}!\n\n"
                f"Recognition like this is a meaningful reminder that consistency, dedication, and attention to detail compound over time. "
                f"This milestone represents months of focused work, deep technical exploration, and relentless execution {skills_phrase}.\n\n"
                f"Key Lessons from this Journey:\n"
                f"1️⃣ Consistency over Intensity: Incremental technical progress every single day delivers outsized results.\n"
                f"2️⃣ Mastery of Fundamentals: Strong foundations make complex problem-solving intuitive and scalable.\n"
                f"3️⃣ Community & Mentorship: No achievement happens in isolation—collaboration and feedback accelerate growth.{extra_bullets}\n\n"
                f"Thank you to {org}, my mentors, and everyone who has supported me along the way. Your encouragement means the world.\n\n"
                f"Looking forward to raising the bar even higher as I take on new engineering and leadership challenges!"
            )

            post_2 = (
                f"🌟 A milestone worth celebrating!\n\n"
                f"I am deeply humbled to receive '{title}' presented by {org}.\n\n"
                f"When tackling demanding technical goals {skills_phrase}, there are inevitably obstacles, unexpected bugs, and complex pivots. "
                f"Pushing through those moments to deliver meaningful impact makes this recognition especially rewarding.\n\n"
                f"Major takeaways from this experience:\n"
                f"🔹 Embracing difficult challenges as the fastest path to mastery\n"
                f"🔹 Prioritizing engineering quality and user-centric architecture\n"
                f"🔹 The power of staying curious and continuously questioning assumptions{extra_bullets}\n\n"
                f"Gratitude to {org} for this honor. What milestones are you aiming for this quarter? Let’s stay inspired and keep building!"
            )

            post_3 = (
                f"Honored to announce that I have been awarded '{title}' by {org}! 🏅\n\n"
                f"This recognition validates the hard work invested in mastering {skills_str or 'advanced technical domains'}. "
                f"Grateful for the journey, the continuous learning, and the opportunity to build solutions that matter.\n\n"
                f"Thank you to {org} and everyone who supported this milestone! Ready for the next summit. 🚀"
            )

        elif is_internship:
            post_1 = (
                f"💼 Pleased to announce the completion of my internship as '{title}' with {org}!\n\n"
                f"Translating theoretical concepts into production-grade systems has been an incredible learning curve. "
                f"Throughout this role, I had the privilege of working alongside talented engineers and contributing directly to real-world deliverables {skills_phrase}.\n\n"
                f"Key Industry Competencies Developed:\n"
                f"1️⃣ Production Codebases: Navigating large-scale repositories, strict code reviews, and CI/CD automation.\n"
                f"2️⃣ System Performance: Identifying bottlenecks, optimizing database queries, and improving responsiveness.\n"
                f"3️⃣ Agile Collaboration: Participating in sprint planning, retrospectives, and cross-functional problem solving.{extra_bullets}\n\n"
                f"A sincere thank you to my mentors, managers, and teammates at {org} for their guidance, constructive feedback, and trust.\n\n"
                f"Excited to carry these production lessons forward into the next chapter of my career!"
            )

            post_2 = (
                f"🎉 Wrapping up an incredible journey at {org}!\n\n"
                f"I’ve officially completed my internship as '{title}'! Looking back at Day 1 compared to now, the growth in technical depth, "
                f"debugging stamina, and architectural thinking has been immense.\n\n"
                f"Highlights from my time here:\n"
                f"🔹 Spearheading core features in {skills_str or 'our core systems'}\n"
                f"🔹 Learning from senior engineers who raised the bar on clean code and design patterns\n"
                f"🔹 Experiencing the full lifecycle of software development in an agile environment{extra_bullets}\n\n"
                f"Huge shoutout to the entire team at {org} for creating such a supportive and challenging atmosphere.\n\n"
                f"Onward to new opportunities and continuous building! 🚀"
            )

            post_3 = (
                f"Successfully completed my internship for '{title}' at {org}! 💻✨\n\n"
                f"Hands-on engineering, production-grade problem solving, and incredible mentorship {skills_phrase}. "
                f"Thank you to {org} for an unforgettable experience. Ready for what lies ahead! 🎯"
            )

        else:
            cert_line = f"\n\nCredential ID: {cert_id}" if cert_id else ""
            post_1 = (
                f"🎓 Pleased to share that I have officially completed '{title}' from {org}!\n\n"
                f"In an industry moving as fast as software and artificial intelligence, continuous upskilling isn't optional—it's a core discipline. "
                f"This comprehensive curriculum provided rigorous deep-dives into advanced methodologies and practical implementation {skills_phrase}.\n\n"
                f"Key Technical Takeaways:\n"
                f"1️⃣ Advanced Concept Mastery: Developing intuitive understanding of foundational theory and state-of-the-art frameworks.\n"
                f"2️⃣ Practical Implementation: Building projects that mirror real industry constraints and performance requirements.\n"
                f"3️⃣ Systematic Problem Solving: Structuring complex workflows into testable, scalable components.{extra_bullets}\n\n"
                f"I'm looking forward to deploying these practical competencies to architect robust solutions and create tangible impact.{cert_line}\n\n"
                f"Thank you to {org} for delivering an outstanding program. To my network: What certifications or skillsets have had the highest ROI for your career? Let's discuss below! 👇"
            )

            post_2 = (
                f"🚀 Milestone unlocked: Officially completed '{title}' from {org}! 📜✨\n\n"
                f"Continuous learning has always been at the center of my engineering philosophy. Diving deep into this program allowed me to sharpen my expertise "
                f"and gain hands-on experience {skills_phrase}.\n\n"
                f"What stood out most throughout this journey:\n"
                f"🔹 The balance between theoretical depth and practical code execution\n"
                f"🔹 Exploring optimization techniques that scale in production environments\n"
                f"🔹 Gaining clarity on emerging industry best practices and architectural patterns{extra_bullets}\n\n"
                f"Ready to apply these insights directly to current and upcoming builds.{cert_line}\n\n"
                f"What are you learning this month? Would love to exchange insights and recommendations in the comments!"
            )

            post_3 = (
                f"Earned my '{title}' credential from {org}! 🎯\n\n"
                f"Focused on mastering {skills_str or 'high-impact capabilities'}. Ready to bring these practical skills to the next big challenge.{cert_line}\n\n"
                f"Thank you {org} for the comprehensive curriculum. On to the next chapter of growth!"
            )

        return [
            {
                "option_id": 1,
                "title": "In-Depth Technical & Architecture Breakdown",
                "tone": "Technical & Comprehensive",
                "caption": post_1.strip(),
                "hashtags": tag_pool[:12],
                "suggested_skills": skills
            },
            {
                "option_id": 2,
                "title": "Engaging Builder Journey & Story",
                "tone": "Engaging & Narrative",
                "caption": post_2.strip(),
                "hashtags": tag_pool[:12],
                "suggested_skills": skills
            },
            {
                "option_id": 3,
                "title": "Impactful Industry Summary & Takeaways",
                "tone": "Impactful & Direct",
                "caption": post_3.strip(),
                "hashtags": tag_pool[:10],
                "suggested_skills": skills
            }
        ]

post_generator_service = PostGenerationService()
