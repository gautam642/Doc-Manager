#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#include <unistd.h>
#include <direct.h> // For _mkdir on Windows
#include <windows.h>
#define mkdir(dir, mode) _mkdir(dir) // Redefine mkdir for Windows

#define FILE_DIRECTORY "../sample/"            // Path to the "sample" directory
#define METADATA_FILE "../sample/metadata.txt" // Path to metadata file
#define MAX_FILES 100
#define FILENAME_MAX_LEN 50

// Metadata structure
typedef struct
{
    char name[FILENAME_MAX_LEN]; // File name
    size_t size;                 // File size in bytes
    int read_count;              // Count of active readers
    int write_lock;              // Flag for write access
    pthread_mutex_t file_mutex;  // Mutex for thread safety
    pthread_cond_t file_cond;    // Condition variable for synchronization
} FileMetadata;

FileMetadata file_metadata[MAX_FILES];                      // Array to hold metadata for all files
int file_count = 0;                                         // tracks the total number of files
pthread_mutex_t metadata_mutex = PTHREAD_MUTEX_INITIALIZER; // Global mutex for metadata synchronization. A mutex to protect access to the metadata array during multi-threaded operations.

// Initialize the file system directory
void initialize_file_system()
{
    if (mkdir(FILE_DIRECTORY, 0777) == -1)
    {
        perror("mkdir failed or already exists");
    }
}

// Save metadata to a file
void save_metadata()
{
    pthread_mutex_lock(&metadata_mutex); // Lock the global metadata mutex to ensure that only one thread modifies the metadata at a time
    FILE *meta_file = fopen(METADATA_FILE, "w");
    if (!meta_file)
    {
        perror("Failed to open metadata file for writing");
        pthread_mutex_unlock(&metadata_mutex);
        return;
    }
    fprintf(meta_file, "%d\n", file_count);
    for (int i = 0; i < file_count; i++)
    {
        fprintf(meta_file, "%s %zu\n", file_metadata[i].name, file_metadata[i].size);
    }
    fclose(meta_file);
    pthread_mutex_unlock(&metadata_mutex); // Unlock the global metadata mutex
}

// Load metadata from a file
void load_metadata()
{
    pthread_mutex_lock(&metadata_mutex); // Lock the global metadata mutex
    FILE *meta_file = fopen(METADATA_FILE, "r");
    if (!meta_file)
    {
        perror("Metadata file not found, starting fresh");
        pthread_mutex_unlock(&metadata_mutex);
        return;
    }
    fscanf(meta_file, "%d", &file_count);
    for (int i = 0; i < file_count; i++)
    {
        fscanf(meta_file, "%s %zu", file_metadata[i].name, &file_metadata[i].size);
        pthread_mutex_init(&file_metadata[i].file_mutex, NULL);
    }
    fclose(meta_file);
    pthread_mutex_unlock(&metadata_mutex); // Unlock the global metadata mutex
}

// Find file index by name
int find_file_index(const char *filename)
{
    for (int i = 0; i < file_count; i++)
    {
        if (strcmp(file_metadata[i].name, filename) == 0)
        {
            return i;
        }
    }
    return -1;
}

// Rename a file
void rename_file(const char *old_name, const char *new_name)
{
    load_metadata(); // Refresh metadata before operation
    int index = find_file_index(old_name);
    if (index == -1)
    {
        printf("File '%s' does not exist.\n", old_name);
        return;
    }
    if (find_file_index(new_name) != -1)
    {
        printf("File '%s' already exists. Choose a different name.\n", new_name);
        return;
    }

    char old_path[FILENAME_MAX_LEN + sizeof(FILE_DIRECTORY)];
    char new_path[FILENAME_MAX_LEN + sizeof(FILE_DIRECTORY)];
    sprintf(old_path, "%s%s", FILE_DIRECTORY, old_name);
    sprintf(new_path, "%s%s", FILE_DIRECTORY, new_name);

    if (rename(old_path, new_path) == 0)
    {
        pthread_mutex_lock(&file_metadata[index].file_mutex);
        strcpy(file_metadata[index].name, new_name); // Update the name in metadata
        save_metadata();                             // Save updated metadata
        pthread_mutex_unlock(&file_metadata[index].file_mutex);
        printf("File '%s' renamed to '%s'.\n", old_name, new_name);
    }
    else
    {
        perror("Failed to rename file");
    }
}

// Other functions remain unchanged (create_file, write_file, read_file, delete_file, list_files)

// Create a new file
void create_file(const char *filename)
{
    load_metadata();
    if (find_file_index(filename) != -1)
    {
        printf("File '%s' already exists.\n", filename);
        return;
    }

    char full_path[FILENAME_MAX_LEN + sizeof(FILE_DIRECTORY)];
    sprintf(full_path, "%s%s", FILE_DIRECTORY, filename);

    FILE *file = fopen(full_path, "w");
    if (file)
    {
        fclose(file);
        strcpy(file_metadata[file_count].name, filename);
        file_metadata[file_count].size = 0;
        file_metadata[file_count].read_count = 0;
        file_metadata[file_count].write_lock = 0;
        pthread_mutex_init(&file_metadata[file_count].file_mutex, NULL);
        pthread_cond_init(&file_metadata[file_count].file_cond, NULL);
        file_count++;
        save_metadata();
        printf("File '%s' created.\n", filename);
    }
    else
    {
        printf("Failed to create file '%s'.\n", filename);
    }
}


void write_file(const char *filename)
{
    char content[256];
    
    // Create the full path for the file
    char full_path[FILENAME_MAX_LEN + sizeof(FILE_DIRECTORY)];
    sprintf(full_path, "%s%s", FILE_DIRECTORY, filename);

    // Open the file with exclusive write access
    HANDLE hFile = CreateFile(
        full_path,
        GENERIC_WRITE,
        0, // Exclusive access (no sharing)
        NULL,
        OPEN_ALWAYS, // Create the file if it doesn't exist
        FILE_ATTRIBUTE_NORMAL,
        NULL);

    if (hFile == INVALID_HANDLE_VALUE)
    {
        printf("Failed to open file '%s'. Error: %lu\n", filename, GetLastError());
        return;
    }

    // Lock the file
    if (!LockFile(hFile, 0, 0, MAXDWORD, MAXDWORD)) // Lock the entire file
    {
        printf("Failed to lock file '%s'. Error: %lu\n", filename, GetLastError());
        CloseHandle(hFile);
        return;
    }

    printf("File '%s' is locked for writing.\n", filename);

    //taking input
    printf("Enter content: ");
    getchar();
    fgets(content, sizeof(content), stdin);
    content[strcspn(content, "\n")] = 0;
    strcat(content, "\n");

    // Move to the end of the file for appending
    SetFilePointer(hFile, 0, NULL, FILE_END);

    // Write content to the file
    DWORD bytesWritten;
    if (!WriteFile(hFile, content, strlen(content), &bytesWritten, NULL))
    {
        printf("Failed to write to file '%s'. Error: %lu\n", filename, GetLastError());
    }
    else
    {
        printf("Data written to '%s'.\n", filename);
    }

    // Unlock the file
    if (!UnlockFile(hFile, 0, 0, MAXDWORD, MAXDWORD))
    {
        printf("Failed to unlock file '%s'. Error: %lu\n", filename, GetLastError());
    }
    else
    {
        printf("File '%s' is unlocked.\n", filename);
    }

    // Close the file handle
    CloseHandle(hFile);
}

// Read a file
void read_file(const char *filename)
{
    load_metadata();
    int index = find_file_index(filename);
    if (index == -1)
    {
        printf("File '%s' does not exist.\n", filename);
        return;
    }

    pthread_mutex_lock(&file_metadata[index].file_mutex);

    // Wait if the file is being written to
    while (file_metadata[index].write_lock)
    {
        pthread_cond_wait(&file_metadata[index].file_cond, &file_metadata[index].file_mutex);
    }

    file_metadata[index].read_count++; // Increment reader count
    pthread_mutex_unlock(&file_metadata[index].file_mutex);

    // Read the file content
    char full_path[FILENAME_MAX_LEN + sizeof(FILE_DIRECTORY)];
    sprintf(full_path, "%s%s", FILE_DIRECTORY, filename);

    FILE *file = fopen(full_path, "r");
    if (file)
    {
        char line[256];
        printf("Contents of '%s':\n", filename);
        while (fgets(line, sizeof(line), file))
        {
            printf("%s", line);
        }
        fclose(file);
    }
    else
    {
        printf("Failed to read file '%s'.\n", filename);
    }

    pthread_mutex_lock(&file_metadata[index].file_mutex);
    file_metadata[index].read_count--; // Decrement reader count
    if (file_metadata[index].read_count == 0)
    {
        pthread_cond_signal(&file_metadata[index].file_cond); // Notify waiting writers
    }
    pthread_mutex_unlock(&file_metadata[index].file_mutex);
}

// Delete a file
void delete_file(const char *filename)
{
    load_metadata(); // Refresh metadata before operation
    int index = find_file_index(filename);
    if (index == -1)
    {
        printf("File '%s' does not exist.\n", filename);
        return;
    }

    char full_path[FILENAME_MAX_LEN + sizeof(FILE_DIRECTORY)];
    sprintf(full_path, "%s%s", FILE_DIRECTORY, filename);

    if (remove(full_path) == 0)
    {
        pthread_mutex_destroy(&file_metadata[index].file_mutex);

        for (int i = index; i < file_count - 1; i++)
        {
            file_metadata[i] = file_metadata[i + 1];
        }
        file_count--;
        save_metadata(); // Update metadata file
        printf("File '%s' deleted.\n", filename);
    }
    else
    {
        printf("Failed to delete file '%s'.\n", filename);
    }
}

// List all files
void list_files()
{
    load_metadata(); // Refresh metadata before operation
    printf("Files in the system:\n");
    for (int i = 0; i < file_count; i++)
    {
        printf("%s - Size: %zu bytes\n", file_metadata[i].name, file_metadata[i].size);
    }
}

// Command-line interface
void run_file_system()
{
    char command[10];
    char filename[FILENAME_MAX_LEN];
    char new_filename[FILENAME_MAX_LEN];
    char content[256];

    system("cls"); 
    printf("=============================================================================\n");
    printf("                  Welcome to the File Management System\n");
    printf("=============================================================================\n");

    while (1)
    {
        printf("            Commands: \n\t\t\t1. create\n\t\t\t2. write\n\t\t\t3. read\n\t\t\t4. delete\n\t\t\t5. rename\n\t\t\t6. list\n\t\t\t7. exit\n");
        printf("=============================================================================\n");
        printf("Enter your command: ");
        scanf("%s", command);

        if (strcmp(command, "create") == 0)
        {
            printf("Enter filename: ");
            scanf("%s", filename);
            create_file(filename);
        }
        else if (strcmp(command, "write") == 0)
        {
            printf("Enter filename: ");
            scanf("%s", filename);
            // fgets(content, sizeof(content), stdin);
            // content[strcspn(content, "\n")] = 0;
            write_file(filename);
        }
        else if (strcmp(command, "read") == 0)
        {
            printf("Enter filename: ");
            scanf("%s", filename);
            read_file(filename);
        }
        else if (strcmp(command, "delete") == 0)
        {
            printf("Enter filename: ");
            scanf("%s", filename);
            delete_file(filename);
        }
        else if (strcmp(command, "rename") == 0)
        {
            printf("Enter old filename: ");
            scanf("%s", filename);
            printf("Enter new filename: ");
            scanf("%s", new_filename);
            rename_file(filename, new_filename);
        }
        else if (strcmp(command, "list") == 0)
        {
            list_files();
        }
        else if (strcmp(command, "exit") == 0)
        {
            printf("Exiting...\n");
            break;
        }
        else
        {
            printf("Invalid command. Try again.\n");
        }
        printf("\n=============================================================================\n");
    }
}

int main()
{
    initialize_file_system();
    load_metadata(); // Load metadata at the start
    run_file_system();
    return 0;
}

