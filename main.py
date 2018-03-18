import sys
from process_images import convert_imgs_to_arrays
import shutil
from Naked.toolshed.shell import execute_js, muterun_js
from algo import *

def readImageFile():
    imageFilePath = sys.argv[1]
    return imageFilePath

def copy_file_to_local_dir(imageFilePath):
    shutil.copy(imageFilePath, 'data/images')

if __name__ == '__main__':
    imageFilePath = readImageFile()
    copy_file_to_local_dir(imageFilePath)
    convert_imgs_to_arrays('data/images', 'data/images_npz')
    run_algo('data/images_npz')
    status = execute_js('server.js')
    print(status)
    
