import json
import re

def slugify(text):
    return re.sub(r'[\W_]+', '_', text.lower()).strip('_')

def process_cinema():
    with open('EngWeb2026/TP6/cinema.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    original_movies = data['filmes']
    
    movies = []
    actors = {}
    genres = {}
    
    for i, m in enumerate(original_movies):
        m_id = f"f{i+1}"
        title = m.get('title', 'Unknown')
        year = m.get('year', 0)
        cast = m.get('cast', [])
        m_genres = m.get('genres', [])
        
        # Process Movie
        movie_doc = {
            "_id": m_id,
            "title": title,
            "year": year,
            "cast": cast,
            "genres": m_genres
        }
        movies.append(movie_doc)
        
        # Process Actors
        for actor_name in cast:
            a_id = slugify(actor_name)
            if not a_id: continue
            if a_id not in actors:
                actors[a_id] = {
                    "_id": a_id,
                    "nome": actor_name,
                    "filmes": []
                }
            actors[a_id]["filmes"].append({"id": m_id, "title": title})
            
        # Process Genres
        for genre_name in m_genres:
            g_id = slugify(genre_name)
            if not g_id: continue
            if g_id not in genres:
                genres[g_id] = {
                    "_id": g_id,
                    "designacao": genre_name,
                    "filmes": []
                }
            genres[g_id]["filmes"].append({"id": m_id, "title": title})

    # Convert dicts to lists
    actors_list = list(actors.values())
    genres_list = list(genres.values())

    # Write results
    with open('EngWeb2026/TP6/api_dados/filmes.json', 'w', encoding='utf-8') as f:
        json.dump(movies, f, ensure_ascii=False, indent=2)
    
    with open('EngWeb2026/TP6/api_dados/atores.json', 'w', encoding='utf-8') as f:
        json.dump(actors_list, f, ensure_ascii=False, indent=2)
        
    with open('EngWeb2026/TP6/api_dados/generos.json', 'w', encoding='utf-8') as f:
        json.dump(genres_list, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    process_cinema()
