import { Router, Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Category, CategoryType } from '../entities/Category';

const router = Router();

// GET /api/categories - List all categories
router.get('/', async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        const categoryRepository = AppDataSource.getRepository(Category);
        
        const queryBuilder = categoryRepository
            .createQueryBuilder('category')
            .where('category.active = :active', { active: true })
            .orderBy('category.name', 'ASC');

        if (type && Object.values(CategoryType).includes(type as CategoryType)) {
            queryBuilder.andWhere('category.type = :type', { type });
        }

        const categories = await queryBuilder.getMany();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
    }
});

// POST /api/categories - Create new category
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, type, description, color, parentId } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        if (!Object.values(CategoryType).includes(type)) {
            return res.status(400).json({ error: 'Invalid category type' });
        }

        const categoryRepository = AppDataSource.getRepository(Category);
        
        const category = categoryRepository.create({
            name,
            type,
            description,
            color,
            parentId: parentId ? parseInt(parentId) : undefined
        });

        const savedCategory = await categoryRepository.save(category);
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category', details: error.message });
    }
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const categoryId = parseInt(req.params.id);
        const categoryRepository = AppDataSource.getRepository(Category);
        
        const category = await categoryRepository.findOneBy({ id: categoryId });
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch category', details: error.message });
    }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const categoryId = parseInt(req.params.id);
        const { name, type, description, color, parentId, active } = req.body;

        const categoryRepository = AppDataSource.getRepository(Category);
        const category = await categoryRepository.findOneBy({ id: categoryId });
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        if (name !== undefined) category.name = name;
        if (type !== undefined) {
            if (!Object.values(CategoryType).includes(type)) {
                return res.status(400).json({ error: 'Invalid category type' });
            }
            category.type = type;
        }
        if (description !== undefined) category.description = description;
        if (color !== undefined) category.color = color;
        if (parentId !== undefined) category.parentId = parentId ? parseInt(parentId) : null;
        if (active !== undefined) category.active = active;

        const savedCategory = await categoryRepository.save(category);
        res.json(savedCategory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category', details: error.message });
    }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const categoryId = parseInt(req.params.id);
        const categoryRepository = AppDataSource.getRepository(Category);
        
        const category = await categoryRepository.findOneBy({ id: categoryId });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Soft delete by marking inactive
        category.active = false;
        await categoryRepository.save(category);
        
        res.json({ message: 'Category deactivated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category', details: error.message });
    }
});

export default router;