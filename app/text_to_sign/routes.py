from flask import render_template, request, current_app
from app.text_to_sign import text_to_sign_bp
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import nltk
import os
# from num2words import num2words

# Configure static files path - relative to the Flask app root
text_to_sign_bp.static_folder = '../static/assets'  # Going up one level from text_to_sign to reach static/assets
text_to_sign_bp.static_url_path = '/static/assets'  # URL path that will be used to access static files

def find_static_file(path):
    static_file = os.path.join(current_app.root_path, 'static/assets', path)
    if os.path.exists(static_file):
        return static_file
    return None

# Import any additional Flask extensions you need
# from flask_sqlalchemy import SQLAlchemy
# from flask_login import login_required, current_user

# Import any models you need
# from app.models import YourModel

# Import any forms you need
# from .forms import YourForm

# Place your text_to_sign.py routes here
# Change @app.route to @text_to_sign_bp.route
@text_to_sign_bp.route('/')
def index():
    return render_template('text_to_sign/index.html', title='App 2')

@text_to_sign_bp.route('/feature2')
def feature2():
    return render_template('text_to_sign/feature2.html', title='App 2 Feature')

# Add all your other routes below
# Example:
'''
@text_to_sign_bp.route('/your-route', methods=['GET', 'POST'])
def your_route():
    # Your route logic here
    return render_template('text_to_sign/your-template.html')
'''

@text_to_sign_bp.route('/animation', methods=['GET', 'POST'])
def animation_view():
    if request.method == 'POST':
        text = request.form.get('sen', '')
        text = text.lower()
        
        # Tokenizing the sentence
        words = word_tokenize(text)
        
        tagged = nltk.pos_tag(words)
        tense = {}
        tense["future"] = len([word for word in tagged if word[1] == "MD"])
        tense["present"] = len([word for word in tagged if word[1] in ["VBP", "VBZ","VBG"]])
        tense["past"] = len([word for word in tagged if word[1] in ["VBD", "VBN"]])
        tense["present_continuous"] = len([word for word in tagged if word[1] in ["VBG"]])

        # Stopwords that will be removed
        stop_words = set(["mightn't", 're', 'wasn', 'wouldn', 'be', 'has', 'that', 'does', 'shouldn', 'do', "you've",
                         'off', 'for', "didn't", 'm', 'ain', 'haven', "weren't", 'are', "she's", "wasn't", 'its', 
                         "haven't", "wouldn't", 'don', 'weren', 's', "you'd", "don't", 'doesn', "hadn't", 'is', 'was', 
                         "that'll", "should've", 'a', 'then', 'the', 'mustn', 'i', 'nor', 'as', "it's", "needn't", 
                         'd', 'am', 'have',  'hasn', 'o', "aren't", "you'll", "couldn't", "you're", "mustn't", 'didn', 
                         "doesn't", 'll', 'an', 'hadn', 'whom', 'y', "hasn't", 'itself', 'couldn', 'needn', "shan't", 
                         'isn', 'been', 'such', 'shan', "shouldn't", 'aren', 'being', 'were', 'did', 'ma', 't', 
                         'having', 'mightn', 've', "isn't", "won't"])

        # Removing stopwords and applying lemmatizing nlp process to words
        lr = WordNetLemmatizer()
        filtered_text = []
        for w, p in zip(words, tagged):
            if w not in stop_words:
                if p[1] in ['VBG', 'VBD', 'VBZ', 'VBN', 'NN']:
                    filtered_text.append(lr.lemmatize(w, pos='v'))
                elif p[1] in ['JJ', 'JJR', 'JJS', 'RBR', 'RBS']:
                    filtered_text.append(lr.lemmatize(w, pos='a'))
                else:
                    filtered_text.append(lr.lemmatize(w))

        # Adding the specific word to specify tense
        words = filtered_text
        temp = []
        for w in words:
            if w == 'I':
                temp.append('Me')
            else:
                temp.append(w)
        words = temp
        probable_tense = max(tense, key=tense.get)

        if probable_tense == "past" and tense["past"] >= 1:
            temp = ["Before"]
            temp = temp + words
            words = temp
        elif probable_tense == "future" and tense["future"] >= 1:
            if "Will" not in words:
                temp = ["Will"]
                temp = temp + words
                words = temp
        elif probable_tense == "present":
            if tense["present_continuous"] >= 1:
                temp = ["Now"]
                temp = temp + words
                words = temp

        filtered_text = []
        for w in words:
            path = w + ".mp4"
            f = find_static_file(path)
            # Splitting the word if its animation is not present in database
            if not f:
                for c in w:
                    filtered_text.append(c)
            # Otherwise animation of word
            else:
                filtered_text.append(w)
        words = filtered_text

        return render_template('text_to_sign/index.html', words=words if words else [], text=text)
    else:
        return render_template('text_to_sign/index.html', words=[], text='')


if __name__ == '__main__':
    text_to_sign_bp.run(debug=True)


# Place the rest of your text_to_sign.py code here
