package com.ultimatetodoappcli

import android.app.Activity
import android.os.Bundle
import android.widget.*
import android.view.ViewGroup
import android.graphics.Color
import android.graphics.Typeface
import android.app.AlertDialog
import android.content.Context
import java.util.*

data class TodoTask(
    var id: String = UUID.randomUUID().toString(),
    var title: String,
    var completed: Boolean = false,
    var priority: String = "Medium",
    var category: String = "Personal"
)

class MainActivity : Activity() {
    
    private val todoTasks = mutableListOf<TodoTask>()
    private lateinit var taskAdapter: ArrayAdapter<String>
    private lateinit var taskListView: ListView
    private lateinit var taskInput: EditText
    private lateinit var statsDisplay: TextView
    private lateinit var categorySpinner: Spinner
    private lateinit var prioritySpinner: Spinner
    
    private val categories = arrayOf("Personal", "Work", "Shopping", "Health", "Other")
    private val priorities = arrayOf("Low", "Medium", "High")
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        createTodoUI()
        addSampleTasks()
        refreshTaskList()
    }
    
    private fun createTodoUI() {
        // Main scroll container
        val scrollView = ScrollView(this)
        val mainLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#f0f0f0"))
        }
        
        // 🚀 HEADER SECTION
        val headerLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#1976d2"))
            setPadding(32, 64, 32, 32)
        }
        
        val appTitle = TextView(this).apply {
            text = "🚀 ULTIMATE TODO APP"
            textSize = 26f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            gravity = android.view.Gravity.CENTER
        }
        
        statsDisplay = TextView(this).apply {
            text = "📊 Loading statistics..."
            textSize = 15f
            setTextColor(Color.parseColor("#bbdefb"))
            gravity = android.view.Gravity.CENTER
            setPadding(0, 20, 0, 0)
        }
        
        headerLayout.addView(appTitle)
        headerLayout.addView(statsDisplay)
        
        // ➕ ADD TASK SECTION
        val addTaskSection = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.WHITE)
            setPadding(24, 24, 24, 24)
        }
        
        val addTitle = TextView(this).apply {
            text = "➕ ADD NEW TASK"
            textSize = 18f
            setTextColor(Color.parseColor("#333333"))
            typeface = Typeface.DEFAULT_BOLD
            setPadding(0, 0, 0, 16)
        }
        
        taskInput = EditText(this).apply {
            hint = "What needs to be done?"
            textSize = 16f
            setPadding(20, 20, 20, 20)
            setBackgroundColor(Color.parseColor("#f8f8f8"))
        }
        
        // Dropdowns layout
        val dropdownLayout = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 16, 0, 16)
        }
        
        val categoryLabel = TextView(this).apply {
            text = "Category:"
            textSize = 14f
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 12, 0)
            }
        }
        
        categorySpinner = Spinner(this).apply {
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_item, categories).apply {
                setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            }
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }
        
        val priorityLabel = TextView(this).apply {
            text = "Priority:"
            textSize = 14f
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(16, 0, 12, 0)
            }
        }
        
        prioritySpinner = Spinner(this).apply {
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_item, priorities).apply {
                setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            }
            setSelection(1) // Default to Medium
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }
        
        dropdownLayout.addView(categoryLabel)
        dropdownLayout.addView(categorySpinner)
        dropdownLayout.addView(priorityLabel)
        dropdownLayout.addView(prioritySpinner)
        
        // Buttons layout
        val buttonLayout = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 16, 0, 0)
        }
        
        val addButton = Button(this).apply {
            text = "✅ ADD TASK"
            textSize = 14f
            setBackgroundColor(Color.parseColor("#4caf50"))
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(0, 0, 8, 0)
            }
            setOnClickListener { addNewTask() }
        }
        
        val clearAllButton = Button(this).apply {
            text = "🗑️ CLEAR ALL"
            textSize = 14f
            setBackgroundColor(Color.parseColor("#f44336"))
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(8, 0, 0, 0)
            }
            setOnClickListener { clearAllTasks() }
        }
        
        buttonLayout.addView(addButton)
        buttonLayout.addView(clearAllButton)
        
        addTaskSection.addView(addTitle)
        addTaskSection.addView(taskInput)
        addTaskSection.addView(dropdownLayout)
        addTaskSection.addView(buttonLayout)
        
        // 🔍 FILTER SECTION
        val filterSection = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(Color.parseColor("#e3f2fd"))
            setPadding(20, 20, 20, 20)
        }
        
        val filterLabel = TextView(this).apply {
            text = "🔍 FILTER:"
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#1976d2"))
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 16, 0)
            }
        }
        
        val showAllBtn = Button(this).apply {
            text = "ALL"
            textSize = 12f
            setBackgroundColor(Color.parseColor("#2196f3"))
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(0, 0, 4, 0)
            }
            setOnClickListener { filterTasks("all") }
        }
        
        val showPendingBtn = Button(this).apply {
            text = "PENDING"
            textSize = 12f
            setBackgroundColor(Color.parseColor("#ff9800"))
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(4, 0, 4, 0)
            }
            setOnClickListener { filterTasks("pending") }
        }
        
        val showCompletedBtn = Button(this).apply {
            text = "COMPLETED"
            textSize = 12f
            setBackgroundColor(Color.parseColor("#4caf50"))
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(4, 0, 0, 0)
            }
            setOnClickListener { filterTasks("completed") }
        }
        
        filterSection.addView(filterLabel)
        filterSection.addView(showAllBtn)
        filterSection.addView(showPendingBtn)
        filterSection.addView(showCompletedBtn)
        
        // 📋 TASK LIST SECTION
        val listSection = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.WHITE)
            setPadding(16, 16, 16, 32)
        }
        
        val listTitle = TextView(this).apply {
            text = "📋 YOUR TASKS"
            textSize = 16f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#333333"))
            setPadding(0, 0, 0, 16)
        }
        
        taskListView = ListView(this).apply {
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 600)
        }
        
        // Set up task list interactions
        taskListView.setOnItemClickListener { _, _, position, _ ->
            toggleTaskCompletion(position)
        }
        
        taskListView.setOnItemLongClickListener { _, _, position, _ ->
            deleteTaskAtPosition(position)
            true
        }
        
        listSection.addView(listTitle)
        listSection.addView(taskListView)
        
        // Add all sections to main layout
        mainLayout.addView(headerLayout)
        mainLayout.addView(addTaskSection)
        mainLayout.addView(filterSection)
        mainLayout.addView(listSection)
        
        scrollView.addView(mainLayout)
        setContentView(scrollView)
    }
    
    private fun addNewTask() {
        val title = taskInput.text.toString().trim()
        if (title.isNotEmpty()) {
            val newTask = TodoTask(
                title = title,
                category = categories[categorySpinner.selectedItemPosition],
                priority = priorities[prioritySpinner.selectedItemPosition]
            )
            todoTasks.add(0, newTask)
            taskInput.text.clear()
            refreshTaskList()
            updateStatistics()
            Toast.makeText(this, "✅ Task '$title' added!", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "❌ Please enter a task title", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun toggleTaskCompletion(position: Int) {
        if (position < todoTasks.size) {
            val task = todoTasks[position]
            task.completed = !task.completed
            refreshTaskList()
            updateStatistics()
            val status = if (task.completed) "completed ✅" else "pending ⭕"
            Toast.makeText(this, "Task marked as $status", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun deleteTaskAtPosition(position: Int) {
        if (position < todoTasks.size) {
            val task = todoTasks[position]
            AlertDialog.Builder(this)
                .setTitle("🗑️ Delete Task")
                .setMessage("Delete '${task.title}'?")
                .setPositiveButton("DELETE") { _, _ ->
                    todoTasks.removeAt(position)
                    refreshTaskList()
                    updateStatistics()
                    Toast.makeText(this, "🗑️ Task deleted", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("CANCEL", null)
                .show()
        }
    }
    
    private fun clearAllTasks() {
        if (todoTasks.isNotEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("🗑️ Clear All Tasks")
                .setMessage("Delete all ${todoTasks.size} tasks?")
                .setPositiveButton("CLEAR ALL") { _, _ ->
                    todoTasks.clear()
                    refreshTaskList()
                    updateStatistics()
                    Toast.makeText(this, "🗑️ All tasks cleared", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("CANCEL", null)
                .show()
        }
    }
    
    private fun filterTasks(filter: String) {
        val filteredTasks = when(filter) {
            "pending" -> todoTasks.filter { !it.completed }
            "completed" -> todoTasks.filter { it.completed }
            else -> todoTasks
        }
        
        val displayList = filteredTasks.map { formatTaskForDisplay(it) }
        taskAdapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, displayList)
        taskListView.adapter = taskAdapter
        
        Toast.makeText(this, "🔍 Showing ${filteredTasks.size} tasks ($filter)", Toast.LENGTH_SHORT).show()
    }
    
    private fun refreshTaskList() {
        val displayList = todoTasks.map { formatTaskForDisplay(it) }
        taskAdapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, displayList)
        taskListView.adapter = taskAdapter
    }
    
    private fun formatTaskForDisplay(task: TodoTask): String {
        val statusIcon = if (task.completed) "✅" else "⭕"
        val priorityIcon = when(task.priority) {
            "High" -> "🔴"
            "Medium" -> "🟡" 
            "Low" -> "🟢"
            else -> "⚪"
        }
        val categoryIcon = when(task.category) {
            "Personal" -> "👤"
            "Work" -> "💼"
            "Shopping" -> "🛒"
            "Health" -> "💪"
            else -> "📁"
        }
        
        return "$statusIcon $priorityIcon $categoryIcon ${task.title}"
    }
    
    private fun updateStatistics() {
        val total = todoTasks.size
        val completed = todoTasks.count { it.completed }
        val pending = total - completed
        val completionRate = if (total > 0) (completed * 100 / total) else 0
        
        statsDisplay.text = "📊 Progress: $completed/$total tasks ($completionRate%) • $pending pending"
    }
    
    private fun addSampleTasks() {
        todoTasks.addAll(listOf(
            TodoTask(title = "✨ Welcome to Ultimate Todo App!", priority = "High", category = "Personal"),
            TodoTask(title = "📝 Tap to add your own task above", priority = "Medium", category = "Work"),
            TodoTask(title = "✅ Tap this task to complete it", priority = "Low", category = "Personal"),
            TodoTask(title = "🛒 Buy groceries for dinner", priority = "High", category = "Shopping"),
            TodoTask(title = "💪 Exercise for 30 minutes", priority = "Medium", category = "Health"),
            TodoTask(title = "📚 Read project documentation", completed = true, priority = "Low", category = "Work"),
            TodoTask(title = "🎯 Long press any task to delete it", priority = "Medium", category = "Personal")
        ))
    }
}