import os
import numpy as np
from utils import Utils
from config import IMAGE_SIZE

def convert_imgs_to_arrays(input_path, output_path):
    print("Converting images to numpy arrays...")
    for f in os.listdir(input_path):
        if f.endswith('.png'):
            img = Utils.get_preprocessed_img("{}/{}".format(input_path, f), IMAGE_SIZE)
            file_name = f[:f.find(".png")]

            np.savez_compressed("{}/{}".format(output_path, file_name), features=img)
            retrieve = np.load("{}/{}.npz".format(output_path, file_name))["features"]

            assert np.array_equal(img, retrieve)
    print("Numpy arrays saved in {}".format(output_path))