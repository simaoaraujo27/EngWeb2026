
import json

def fix_json():
    with open('cinema.json', 'r') as f:
        data = json.load(f)

    filmes = data.get('filmes', [])
    
    atores_dict = {}
    generos_dict = {}

    for i, filme in enumerate(filmes):
        # Assign ID if not exists
        filme['id'] = str(i + 1)
        
        # Collect actors
        cast = filme.get('cast', [])
        for ator in cast:
            if ator not in atores_dict:
                atores_dict[ator] = {
                    "id": ator.replace(" ", "_").replace("/", "_"),
                    "name": ator,
                    "filmes": []
                }
            atores_dict[ator]['filmes'].append({
                "id": filme['id'],
                "title": filme['title']
            })

        # Collect genres
        genres = filme.get('genres', [])
        for genre in genres:
            if genre not in generos_dict:
                generos_dict[genre] = {
                    "id": genre.replace(" ", "_").replace("/", "_"),
                    "name": genre,
                    "filmes": []
                }
            generos_dict[genre]['filmes'].append({
                "id": filme['id'],
                "title": filme['title']
            })

    # Sort lists
    filmes.sort(key=lambda x: x.get('title', ''))
    
    # Convert dicts to lists and sort them
    atores = sorted(atores_dict.values(), key=lambda x: x['name'])
    generos = sorted(generos_dict.values(), key=lambda x: x['name'])

    # Sort movies inside each actor and genre
    for ator in atores:
        ator['filmes'].sort(key=lambda x: x.get('title', ''))
    for genero in generos:
        genero['filmes'].sort(key=lambda x: x.get('title', ''))

    new_data = {
        "filmes": filmes,
        "atores": atores,
        "generos": generos
    }

    with open('db.json', 'w') as f:
        json.dump(new_data, f, indent=2)

if __name__ == "__main__":
    fix_json()
