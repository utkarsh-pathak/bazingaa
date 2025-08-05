# backend/services/gemini.py
import json
import random
import os
import google.generativeai as genai
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

DIR_PATH = os.path.dirname(os.path.realpath(__file__))
QUESTIONS_FILE_PATH = os.path.join(DIR_PATH, 'questions.json')
GENERATION_CONFIG = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

# --- Helper Functions ---

def get_all_questions_from_file():
    """Reads and returns all questions from the local JSON file."""
    try:
        with open(QUESTIONS_FILE_PATH, 'r') as f:
            data = json.load(f)
            logging.info(f"Loaded questions from {QUESTIONS_FILE_PATH}: {data.keys()}")
            return data
    except (FileNotFoundError, json.JSONDecodeError):
        logging.warning(f"Questions file not found or invalid JSON at {QUESTIONS_FILE_PATH}. Returning empty dict.")
        return {}

def save_questions_to_file(questions_data):
    """Saves the provided questions data to the local JSON file."""
    with open(QUESTIONS_FILE_PATH, 'w') as f:
        json.dump(questions_data, f, indent=2)
    logging.info(f"Saved questions to {QUESTIONS_FILE_PATH}. Themes saved: {questions_data.keys()}")

def generate_questions_from_api(theme: str, num_to_generate: int):
    """Generates new questions for a theme using the Gemini API."""
    if not API_KEY:
        logging.warning("GEMINI_API_KEY not found. Cannot generate new questions.")
        return []

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=GENERATION_CONFIG,
    )
    
    prompt = f"""
    Generate {num_to_generate} trivia questions for the theme "{theme}".

    For each question, provide:
    1. "question_text": The trivia question.
    2. "correct_answer": The correct answer.

    **IMPORTANT STYLE GUIDE:**
    - The "correct_answer" should be short, casual, and sound like something a person would type in a hurry.
    - Avoid long, encyclopedic answers.
    - The goal is for the correct answer to blend in with fake answers written by other players.

    Example:
    - GOOD: "The Eiffel Tower"
    - BAD: "The Eiffel Tower, a wrought-iron lattice tower on the Champ de Mars in Paris, France."

    Return the result as a JSON object with a single key "{theme}" which is a list of the generated question objects.
    """
    
    try:
        response = model.generate_content(prompt)
        new_questions = json.loads(response.text)
        logging.info(f"Successfully generated {len(new_questions.get(theme, []))} questions for theme '{theme}' from API.")
        return new_questions.get(theme, [])
    except Exception as e:
        logging.error(f"Error generating questions from Gemini API: {e}")
        return []

# --- Main Service Functions ---

def generate_game_questions(theme: str, num_questions: int, seen_questions: set = None):
    """
    Generates a list of questions for a given theme, using a hybrid approach
    that avoids repeating questions from the 'seen_questions' set.
    """
    if seen_questions is None:
        seen_questions = set()

    all_questions_on_disk = get_all_questions_from_file()
    theme_questions = all_questions_on_disk.get(theme, [])
    logging.info(f"Questions on disk for theme '{theme}': {len(theme_questions)}")

    # Filter out questions that have already been seen in this session
    unseen_questions = [
        q for q in theme_questions if q['question_text'] not in seen_questions
    ]
    logging.info(f"Unseen questions for theme '{theme}': {len(unseen_questions)}")

    # If we don't have enough unseen questions, generate more from the API
    if len(unseen_questions) < num_questions:
        num_to_generate = num_questions - len(unseen_questions)
        logging.info(f"Cache miss for theme '{theme}'. Generating {num_to_generate} new unique question(s).")
        
        newly_generated_questions = generate_questions_from_api(theme, num_to_generate)
        
        if newly_generated_questions:
            # Add the newly generated questions to our unseen pool
            unseen_questions.extend(newly_generated_questions)
            logging.info(f"Added {len(newly_generated_questions)} newly generated questions to unseen pool.")
            
            # Also add them to the main list for this theme and save back to the file
            # This ensures our cache grows with new, unique questions
            all_questions_on_disk[theme] = theme_questions + newly_generated_questions
            save_questions_to_file(all_questions_on_disk)

    if not unseen_questions:
        logging.warning(f"No unseen questions available for theme '{theme}' after generation attempt.")
        return None
        
    num_to_select = min(num_questions, len(unseen_questions))
    selected_questions = random.sample(unseen_questions, num_to_select)
    logging.info(f"Selected {len(selected_questions)} questions for theme '{theme}'.")
    
    return [
        {'question_text': q['question_text'], 'correct_answer': q['correct_answer']}
        for q in selected_questions
    ]

def get_available_themes():
    """
    Returns a list of available themes. It reads from the local cache and
    can be expanded by adding new themes through the generation process.
    """
    logging.info("Attempting to retrieve available themes.")
    all_questions = get_all_questions_from_file()
    logging.info(f"Themes found in questions.json: {list(all_questions.keys())}")
    default_themes = ["Weird History", "Movie Trivia", "Strange Science", "Pop Culture"]
    logging.info(f"Default themes: {default_themes}")
    
    # Merge keys from JSON with default themes for a comprehensive list
    existing_themes = set(all_questions.keys())
    existing_themes.update(default_themes)
    logging.info(f"Merged themes (from file and default): {existing_themes}")
            
    return list(existing_themes)
