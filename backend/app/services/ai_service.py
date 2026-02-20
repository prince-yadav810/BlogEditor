import os
from openai import AsyncOpenAI, AuthenticationError, APIError
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_BASE_URL = "https://api.deepseek.com"
MODEL = "deepseek-chat"

# Lazy client — created on first call so env changes are picked up
_client = None


def _get_client():
    global _client
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY is not set")
    # Recreate if key changed
    if _client is None or _client.api_key != api_key:
        _client = AsyncOpenAI(api_key=api_key, base_url=DEEPSEEK_BASE_URL)
    return _client


# prompts for each action — kept here so the route stays clean
PROMPTS = {
    "summarize": (
        "Summarize the following blog post concisely in 2-3 sentences:\n\n{text}"
    ),
    "fix_grammar": (
        "Fix grammar and improve clarity of the following text. "
        "Return only the corrected text, no explanations:\n\n{text}"
    ),
}


async def generate_stream(text: str, action: str):
    """Yields text chunks from DeepSeek as they arrive.

    The caller wraps this in a StreamingResponse so the frontend
    can read tokens progressively via ReadableStream.
    """
    prompt_template = PROMPTS.get(action)
    if not prompt_template:
        raise ValueError(f"Unknown action: {action}")

    prompt = prompt_template.format(text=text)
    client = _get_client()

    try:
        stream = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
    except AuthenticationError as e:
        yield f"[Error: Authentication failed. Check your DEEPSEEK_API_KEY. Details: {e.message}]"
    except APIError as e:
        yield f"[Error: API error — {e.message}]"
    except Exception as e:
        yield f"[Error: {str(e)}]"
