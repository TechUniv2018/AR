from os import listdir
from keras.models import model_from_json
from keras.preprocessing.text import Tokenizer
from keras.preprocessing.sequence import pad_sequences
from tqdm import tqdm
import numpy as np
import h5py as h5py
from compiler.classes.Compiler import *

def load_doc(filename):
    '''
    Read a file and return a string
    '''
    file = open(filename, 'r')
    text = file.read()
    file.close()
    return text

def load_image_features(data_dir):
    images_features = []
    all_filenames = listdir(data_dir) # Load all the files and order them
    all_filenames.sort()
    for filename in all_filenames:
        print(filename)
        image = np.load(f'{data_dir}/{filename}') # Load the images already prepared in arrays
        images_features.append(image['features'])
    images_features = np.array(images_features, dtype=float)
    return images_features

def create_tokenizer(): 
    tokenizer = Tokenizer(filters='', split=" ", lower=False) # Initialize the function to create the vocabulary 
    tokenizer.fit_on_texts([load_doc('bootstrap.vocab')]) # Create the vocabulary
    return tokenizer

def get_train_features(dir_name):
    print('images_npz data dir:', dir_name)
    train_features = load_image_features(dir_name)
    return train_features

def load_model_with_weights():
    '''
    load model and weights 
    '''
    json_file = open('model.json', 'r')
    loaded_model_json = json_file.read()
    json_file.close()
    loaded_model = model_from_json(loaded_model_json)
    loaded_model.load_weights("weights.h5") #load model and weights 
    print("Loaded model from disk")
    return loaded_model

def word_for_id(integer, tokenizer):
    '''
    map an integer to a word
    '''
    for word, index in tokenizer.word_index.items():
        if index == integer:
            return word
    return None


def generate_desc(model, tokenizer, photo, max_length):
    '''
    generate a description for an image
    '''
    photo = np.array([photo])
    in_text = '<START> ' # seed the generation process
    for i in range(150): # iterate over the whole length of the sequence
        sequence = tokenizer.texts_to_sequences([in_text])[0] # integer encode input sequence
        sequence = pad_sequences([sequence], maxlen=max_length) # pad input
        yhat = model.predict([photo, sequence], verbose=0) # predict next word
        yhat = np.argmax(yhat) # convert probability to integer
        word = word_for_id(yhat, tokenizer) # map integer to word
        if word is None: # stop if we cannot map the word
            break
        in_text += word + ' ' # append as input for generating the next word
        if word == '<END>': # stop if we predict the end of the sequence
            break
    return in_text

def run_model(model, photos, tokenizer, max_length):
    yhat = generate_desc(model, tokenizer, photos[0], max_length)
    predicted = yhat.split() # store actual and predicted
    return predicted

def get_compiler():
    dsl_path = "compiler/assets/web-dsl-mapping.json"
    compiler = Compiler(dsl_path)
    return compiler

def compile_website(compiler, tokens_prediction, website_path):
    '''
    Compile the tokens into HTML and css
    '''
    compiled_website = compiler.compile(tokens_prediction, website_path)
    return compile_website

def run_algo(data_dir):
    model = load_model_with_weights()
    image_features = get_train_features(data_dir)
    print(image_features.shape)
    tokenizer = create_tokenizer()
    prediction = run_model(model, image_features, tokenizer, 48)
    compiler = get_compiler()
    compiled_website = compile_website(compiler, prediction, 'index.html')


    
