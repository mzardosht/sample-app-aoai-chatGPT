import pandas as pd  
import json  

# search for the file name in the Excel file
def get_file_url(file_name):
    # read the config file to get the path to the Excel file
    with open("config.json", 'r') as f:  
        config_data = json.load(f)  
    excel_file_path = config_data[0]['url_mapping_path']

    # read the Excel file  
    df = pd.read_excel(excel_file_path)  
  
    # search for the file name in the Excel file  
    for index, row in df.iterrows():  
        if row['File Name'] == file_name: 
            if isinstance(row['Link URL'], str) and row['Link URL'].strip():   
                return row['Link URL']  
  
    # if the file name was not found, return None  
    return None  
